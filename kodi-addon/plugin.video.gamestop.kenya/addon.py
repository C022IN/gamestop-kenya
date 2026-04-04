"""
GameStop Kenya Movies Kodi Video Addon
Fetches content from the GameStop Kenya API and presents it in Kodi.
"""

import sys
import json
import xbmc
import xbmcgui
import xbmcplugin
import xbmcaddon

try:
    from urllib.parse import urlencode, parse_qsl, quote_plus
    import urllib.request as urllib_request
    import urllib.error as urllib_error
except ImportError:
    from urllib import urlencode, quote_plus
    from urlparse import parse_qsl
    import urllib2 as urllib_request
    import urllib2 as urllib_error


ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo("id")
PLUGIN_URL = sys.argv[0] if len(sys.argv) > 0 else ""
HANDLE = int(sys.argv[1]) if len(sys.argv) > 1 else -1
DEFAULT_SITE_URL = "https://www.gamestop.co.ke"


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_api_base():
    configured_base = ADDON.getSetting("base_url")
    base_url = normalise_site_url(configured_base)
    if configured_base.strip().rstrip("/") != base_url:
        ADDON.setSetting("base_url", base_url)
        xbmc.log(f"[{ADDON_ID}] Normalised Site URL to {base_url}", xbmc.LOGWARNING)
    return f"{base_url}/api"


def build_url(params):
    return f"{PLUGIN_URL}?{urlencode(params)}"


def get_phone_number():
    return ADDON.getSetting("phone_number").strip()


def get_access_code():
    return ADDON.getSetting("access_code").strip()


def get_auth_token():
    return ADDON.getSetting("auth_token").strip()


def set_auth_token(token):
    ADDON.setSetting("auth_token", token or "")


def clear_auth():
    ADDON.setSetting("phone_number", "")
    ADDON.setSetting("access_code", "")
    ADDON.setSetting("auth_token", "")


def build_headers():
    headers = {
        "User-Agent": "Kodi/GameStopKenya",
        "Accept": "application/json",
    }
    token = get_auth_token()
    if token:
        headers["Cookie"] = f"gsm_movie_session={token}"
    return headers


def show_notification(message, level=xbmcgui.NOTIFICATION_INFO):
    xbmcgui.Dialog().notification(ADDON.getAddonInfo("name"), message, level)


def end_directory(succeeded=True):
    """Always close the directory handle — never leave it open."""
    xbmcplugin.endOfDirectory(HANDLE, succeeded=succeeded)


def normalise_phone(phone):
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("0") and len(digits) >= 10:
        return "254" + digits[1:]
    if digits.startswith("254"):
        return digits
    return digits


def normalise_site_url(base_url):
    site_url = (base_url or "").strip().rstrip("/")
    if not site_url:
        return DEFAULT_SITE_URL
    if "://" not in site_url:
        site_url = f"https://{site_url}"
    if site_url.startswith("https://gamestop.co.ke"):
        return f"https://www.gamestop.co.ke{site_url[len('https://gamestop.co.ke'):]}"
    if site_url.startswith("http://gamestop.co.ke"):
        return f"http://www.gamestop.co.ke{site_url[len('http://gamestop.co.ke'):]}"
    return site_url


# ── Network ───────────────────────────────────────────────────────────────────

def extract_cookie(resp_headers, cookie_name):
    try:
        all_set_cookie = resp_headers.get_all("set-cookie") or []
    except AttributeError:
        all_set_cookie = [v for k, v in resp_headers.items() if k.lower() == "set-cookie"]

    prefix = f"{cookie_name}="
    for header_value in all_set_cookie:
        for part in header_value.split(";"):
            part = part.strip()
            if part.startswith(prefix):
                return part[len(prefix):]
    return None


def post_json(url, payload):
    try:
        body = json.dumps(payload).encode("utf-8")
        req = urllib_request.Request(
            url, data=body,
            headers={
                "User-Agent": "Kodi/GameStopKenya",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        with urllib_request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            resp_headers = resp.headers
            final_url = resp.geturl() if hasattr(resp, "geturl") else url
            xbmc.log(f"[{ADDON_ID}] POST {url} payload={payload}", xbmc.LOGINFO)
            if final_url != url:
                xbmc.log(f"[{ADDON_ID}] POST redirected to {final_url}", xbmc.LOGWARNING)
            xbmc.log(f"[{ADDON_ID}] POST response: {raw[:1200]}", xbmc.LOGINFO)
            try:
                return json.loads(raw), resp_headers
            except Exception:
                return {"raw": raw}, resp_headers

    except urllib_error.HTTPError as e:
        try:
            raw = e.read().decode("utf-8")
        except Exception:
            raw = ""
        resp_headers = getattr(e, "headers", None)
        redirect_target = resp_headers.get("Location") if resp_headers else None
        xbmc.log(f"[{ADDON_ID}] POST HTTPError {e.code} for {url}. Body: {raw[:1200]}", xbmc.LOGERROR)
        if redirect_target:
            xbmc.log(f"[{ADDON_ID}] POST redirect target: {redirect_target}", xbmc.LOGERROR)
        if e.code in (301, 302, 307, 308):
            return {
                "error": (
                    f"Site URL redirected to {redirect_target or 'another URL'}. "
                    f"Set Site URL to {DEFAULT_SITE_URL}"
                )
            }, resp_headers
        try:
            parsed = json.loads(raw) if raw else {"error": f"HTTP {e.code}"}
        except Exception:
            parsed = {"error": raw or f"HTTP {e.code}"}
        return parsed, resp_headers

    except Exception as e:
        xbmc.log(f"[{ADDON_ID}] post_json error for {url}: {repr(e)}", xbmc.LOGERROR)
        return {"error": repr(e)}, None


def fetch_json(url):
    try:
        req = urllib_request.Request(url, headers=build_headers())
        with urllib_request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            final_url = resp.geturl() if hasattr(resp, "geturl") else url
            if final_url != url:
                xbmc.log(f"[{ADDON_ID}] GET redirected to {final_url}", xbmc.LOGWARNING)
            xbmc.log(f"[{ADDON_ID}] GET {url} response: {raw[:800]}", xbmc.LOGINFO)
            return json.loads(raw)

    except urllib_error.HTTPError as e:
        try:
            raw = e.read().decode("utf-8")
        except Exception:
            raw = ""
        resp_headers = getattr(e, "headers", None)
        redirect_target = resp_headers.get("Location") if resp_headers else None
        xbmc.log(f"[{ADDON_ID}] GET HTTPError {e.code} for {url}. Body: {raw[:800]}", xbmc.LOGERROR)
        if redirect_target:
            xbmc.log(f"[{ADDON_ID}] GET redirect target: {redirect_target}", xbmc.LOGERROR)
        if e.code in (301, 302, 307, 308):
            show_notification(f"Site URL redirected. Use {DEFAULT_SITE_URL}.", xbmcgui.NOTIFICATION_ERROR)
            return None
        if e.code in (401, 403):
            show_notification("Login required or session expired.", xbmcgui.NOTIFICATION_ERROR)
        return None

    except Exception as e:
        xbmc.log(f"[{ADDON_ID}] fetch_json error for {url}: {repr(e)}", xbmc.LOGERROR)
        return None


# ── Auth ──────────────────────────────────────────────────────────────────────

def prompt_login():
    phone = xbmcgui.Dialog().input("Enter Phone Number", type=xbmcgui.INPUT_ALPHANUM)
    if not phone:
        return False

    access_code = xbmcgui.Dialog().input(
        "Enter Access Code",
        type=xbmcgui.INPUT_ALPHANUM,
        option=xbmcgui.ALPHANUM_HIDE_INPUT,
    )
    if not access_code:
        return False

    phone = normalise_phone(phone.strip())
    access_code = access_code.strip().upper()

    data, headers = post_json(
        f"{get_api_base()}/movies/auth/login/",
        {"phone": phone, "accessCode": access_code},
    )
    session_token = extract_cookie(headers, "gsm_movie_session") if headers else None

    xbmc.log(f"[{ADDON_ID}] login data={repr(data)} cookie={repr(session_token)}", xbmc.LOGINFO)

    if not isinstance(data, dict):
        xbmcgui.Dialog().ok(ADDON.getAddonInfo("name"), "Login failed: invalid server response.")
        return False

    if data.get("error"):
        xbmcgui.Dialog().ok(ADDON.getAddonInfo("name"), str(data["error"]))
        return False

    if not session_token:
        xbmcgui.Dialog().ok(
            ADDON.getAddonInfo("name"),
            "Server responded but did not set gsm_movie_session cookie.\n\nResponse: " + repr(data),
        )
        return False

    ADDON.setSetting("phone_number", phone)
    ADDON.setSetting("access_code", "")
    set_auth_token(session_token)
    show_notification("Signed in successfully.")
    return True


def ensure_login():
    if get_auth_token():
        return True

    saved_phone = get_phone_number()
    saved_code = get_access_code()

    if saved_phone and saved_code:
        data, headers = post_json(
            f"{get_api_base()}/movies/auth/login/",
            {"phone": normalise_phone(saved_phone), "accessCode": saved_code.upper()},
        )
        session_token = extract_cookie(headers, "gsm_movie_session") if headers else None
        if isinstance(data, dict) and not data.get("error") and session_token:
            ADDON.setSetting("access_code", "")
            set_auth_token(session_token)
            return True

    if not xbmcgui.Dialog().yesno(
        ADDON.getAddonInfo("name"),
        "Sign in with your phone number and access code?",
    ):
        return False

    return prompt_login()


# ── Directory views ───────────────────────────────────────────────────────────

def list_categories():
    categories = [
        {"label": "Movies",   "mode": "movies",  "icon": "DefaultMovies.png"},
        {"label": "Series",   "mode": "series",  "icon": "DefaultTVShows.png"},
        {"label": "Live TV",  "mode": "live",    "icon": "DefaultVideo.png"},
        {"label": "Search",   "mode": "search",  "icon": "DefaultAddonsSearch.png"},
        {"label": "Sign In",  "mode": "login",   "icon": "DefaultUser.png"},
        {"label": "Sign Out", "mode": "logout",  "icon": "DefaultUser.png"},
    ]
    for cat in categories:
        li = xbmcgui.ListItem(label=cat["label"])
        li.setArt({"icon": cat["icon"]})
        xbmcplugin.addDirectoryItem(HANDLE, build_url({"mode": cat["mode"]}), li, isFolder=True)

    xbmcplugin.addSortMethod(HANDLE, xbmcplugin.SORT_METHOD_NONE)
    end_directory()


def list_movies():
    if not ensure_login():
        end_directory(succeeded=False)
        return

    data = fetch_json(f"{get_api_base()}/movies/catalog/")
    if not data:
        show_notification("Could not load movies.", xbmcgui.NOTIFICATION_ERROR)
        end_directory(succeeded=False)
        return

    for item in data.get("items", []):
        li = xbmcgui.ListItem(label=item.get("title") or "Unknown")
        li.setArt({
            "poster": item.get("poster_url") or "",
            "fanart": item.get("backdrop_url") or "",
            "thumb":  item.get("poster_url") or "",
        })
        info = {
            "title":     item.get("title") or "",
            "plot":      item.get("overview") or "",
            "mediatype": "movie",
        }
        # Only add year/rating if they are valid non-None values
        if item.get("year") is not None:
            info["year"] = int(item["year"])
        if item.get("genres"):
            info["genre"] = ", ".join(item["genres"])
        li.setInfo("video", info)
        li.setProperty("IsPlayable", "true")
        xbmcplugin.addDirectoryItem(
            HANDLE,
            build_url({"mode": "play", "slug": item.get("slug") or "", "id": item.get("id") or ""}),
            li,
            isFolder=False,
        )

    xbmcplugin.addSortMethod(HANDLE, xbmcplugin.SORT_METHOD_LABEL)
    end_directory()


def list_series():
    show_notification("Series coming soon.")
    end_directory()


def list_live_tv():
    show_notification("Live TV coming soon.")
    end_directory()


def play_movie(slug, movie_id):
    if not ensure_login():
        xbmcplugin.setResolvedUrl(HANDLE, False, xbmcgui.ListItem())
        return

    data = fetch_json(
        f"{get_api_base()}/movies/stream/?slug={quote_plus(slug)}&id={quote_plus(movie_id)}"
    )
    if not data or not data.get("stream_url"):
        show_notification("Stream not available.", xbmcgui.NOTIFICATION_ERROR)
        xbmcplugin.setResolvedUrl(HANDLE, False, xbmcgui.ListItem())
        return

    play_item = xbmcgui.ListItem(path=data["stream_url"])
    if data["stream_url"].endswith(".m3u8"):
        play_item.setProperty("inputstream", "inputstream.adaptive")
        play_item.setProperty("inputstream.adaptive.manifest_type", "hls")
    xbmcplugin.setResolvedUrl(HANDLE, True, listitem=play_item)


def search():
    if not ensure_login():
        end_directory(succeeded=False)
        return

    kb = xbmc.Keyboard("", "Search GameStop Kenya Movies")
    kb.doModal()
    if not kb.isConfirmed() or not kb.getText().strip():
        end_directory(succeeded=False)
        return

    query = kb.getText().strip()
    data = fetch_json(f"{get_api_base()}/movies/search/?q={quote_plus(query)}")
    if not data:
        show_notification("Search failed.", xbmcgui.NOTIFICATION_ERROR)
        end_directory(succeeded=False)
        return

    # Response shape: { libraryResults: [...], tmdbResults: [...] }
    items = data.get("libraryResults", []) + data.get("tmdbResults", [])
    # Fallback: some future change may return { items: [...] }
    if not items:
        items = data.get("items", [])

    for item in items:
        # Search results use imageUrl/href (MoviesHubTile shape)
        # Catalog results use poster_url/slug shape
        poster = item.get("imageUrl") or item.get("poster_url") or ""
        # Extract slug from href e.g. /movies/watch/my-slug  or  /movies/film/movie-123
        href = item.get("href") or ""
        slug = item.get("slug") or href.rstrip("/").split("/")[-1] or ""

        li = xbmcgui.ListItem(label=item.get("title") or "Unknown")
        li.setArt({"poster": poster, "thumb": poster})
        info = {"title": item.get("title") or "", "mediatype": "movie"}
        if item.get("genres"):
            info["genre"] = ", ".join(item["genres"])
        if item.get("description"):
            info["plot"] = item["description"]
        li.setInfo("video", info)
        li.setProperty("IsPlayable", "true")
        xbmcplugin.addDirectoryItem(
            HANDLE,
            build_url({"mode": "play", "slug": slug, "id": item.get("id") or ""}),
            li,
            isFolder=False,
        )

    xbmcplugin.addSortMethod(HANDLE, xbmcplugin.SORT_METHOD_LABEL)
    end_directory()


def do_login():
    prompt_login()
    # end_directory must always be called — Container.Refresh re-opens the root
    end_directory()
    xbmc.executebuiltin("Container.Refresh")


def do_logout():
    clear_auth()
    show_notification("Signed out.")
    end_directory()
    xbmc.executebuiltin("Container.Refresh")


# ── Router ────────────────────────────────────────────────────────────────────

def router(params):
    mode = params.get("mode", "root")
    if mode == "root":
        list_categories()
    elif mode == "movies":
        list_movies()
    elif mode == "series":
        list_series()
    elif mode == "live":
        list_live_tv()
    elif mode == "search":
        search()
    elif mode == "play":
        play_movie(params.get("slug", ""), params.get("id", ""))
    elif mode == "login":
        do_login()
    elif mode == "logout":
        do_logout()
    else:
        list_categories()


if HANDLE != -1:
    params = dict(parse_qsl(sys.argv[2][1:])) if len(sys.argv) > 2 else {}
    router(params)
