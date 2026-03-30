"""
GameStop Kenya Movies — Kodi Video Addon
Fetches content from the GameStop Kenya public API and presents it in Kodi.
"""

import sys
import json
import xbmc
import xbmcgui
import xbmcplugin
import xbmcaddon

try:
    # Python 3 (Kodi 19+)
    from urllib.parse import urlencode, parse_qsl, urlparse
    import urllib.request as urllib_request
except ImportError:
    # Python 2 (Kodi 18 Leia)
    from urllib import urlencode
    from urlparse import parse_qsl, urlparse
    import urllib2 as urllib_request

ADDON = xbmcaddon.Addon()
ADDON_ID = ADDON.getAddonInfo('id')
PLUGIN_URL = sys.argv[0]
HANDLE = int(sys.argv[1])

# ── Replace with your deployed domain ───────────────────────────────────────
BASE_URL = 'https://gamestop.co.ke'
API_BASE = f'{BASE_URL}/api'
# ────────────────────────────────────────────────────────────────────────────


def build_url(params):
    return f'{PLUGIN_URL}?{urlencode(params)}'


def fetch_json(url):
    try:
        req = urllib_request.Request(url, headers={'User-Agent': 'Kodi/GameStopKenya'})
        with urllib_request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        xbmc.log(f'[{ADDON_ID}] fetch_json error: {e}', xbmc.LOGERROR)
        return None


def list_categories():
    """Root menu — mirrors the movies hub sections."""
    categories = [
        {'label': 'Movies',      'mode': 'movies',  'icon': 'DefaultMovies.png'},
        {'label': 'Series',      'mode': 'series',  'icon': 'DefaultTVShows.png'},
        {'label': 'Live TV',     'mode': 'live',    'icon': 'DefaultVideo.png'},
        {'label': 'Search',      'mode': 'search',  'icon': 'DefaultAddonsSearch.png'},
    ]

    for cat in categories:
        li = xbmcgui.ListItem(label=cat['label'])
        li.setArt({'icon': cat['icon']})
        li.setInfo('video', {'title': cat['label'], 'mediatype': 'video'})
        url = build_url({'mode': cat['mode']})
        xbmcplugin.addDirectoryItem(HANDLE, url, li, isFolder=True)

    xbmcplugin.addSortMethods(HANDLE, xbmcplugin.SORT_METHOD_NONE)
    xbmcplugin.endOfDirectory(HANDLE)


def list_movies():
    """Fetch movie catalog from the API."""
    data = fetch_json(f'{API_BASE}/media/movies')
    if not data:
        xbmcgui.Dialog().notification(
            ADDON.getAddonInfo('name'),
            'Could not load movies. Check your connection.',
            xbmcgui.NOTIFICATION_ERROR,
        )
        return

    for item in data.get('items', []):
        li = xbmcgui.ListItem(label=item.get('title', 'Unknown'))
        li.setArt({
            'poster': item.get('poster_url', ''),
            'fanart': item.get('backdrop_url', ''),
            'thumb':  item.get('poster_url', ''),
        })
        li.setInfo('video', {
            'title':   item.get('title'),
            'plot':    item.get('overview', ''),
            'year':    item.get('year'),
            'genre':   ', '.join(item.get('genres', [])),
            'rating':  item.get('vote_average'),
            'mediatype': 'movie',
        })
        li.setProperty('IsPlayable', 'true')
        url = build_url({'mode': 'play', 'slug': item.get('slug', ''), 'id': item.get('id', '')})
        xbmcplugin.addDirectoryItem(HANDLE, url, li, isFolder=False)

    xbmcplugin.addSortMethods(HANDLE, xbmcplugin.SORT_METHOD_LABEL)
    xbmcplugin.endOfDirectory(HANDLE)


def play_movie(slug, movie_id):
    """Resolve and play a movie stream URL."""
    data = fetch_json(f'{API_BASE}/media/stream?slug={slug}&id={movie_id}')
    if not data or not data.get('stream_url'):
        xbmcgui.Dialog().notification(
            ADDON.getAddonInfo('name'),
            'Stream not available. Membership required.',
            xbmcgui.NOTIFICATION_ERROR,
        )
        return

    play_item = xbmcgui.ListItem(path=data['stream_url'])
    # HLS streams need the inputstream.adaptive addon on Kodi 19+
    if data['stream_url'].endswith('.m3u8'):
        play_item.setProperty('inputstream', 'inputstream.adaptive')
        play_item.setProperty('inputstream.adaptive.manifest_type', 'hls')

    xbmcplugin.setResolvedUrl(HANDLE, True, listitem=play_item)


def search():
    kb = xbmc.Keyboard('', 'Search GameStop Kenya Movies')
    kb.doModal()
    if kb.isConfirmed():
        query = kb.getText()
        data = fetch_json(f'{API_BASE}/media/search?q={query}')
        if not data:
            return
        for item in data.get('items', []):
            li = xbmcgui.ListItem(label=item.get('title', 'Unknown'))
            li.setArt({'poster': item.get('poster_url', ''), 'thumb': item.get('poster_url', '')})
            li.setInfo('video', {'title': item.get('title'), 'mediatype': 'movie'})
            li.setProperty('IsPlayable', 'true')
            url = build_url({'mode': 'play', 'slug': item.get('slug', ''), 'id': item.get('id', '')})
            xbmcplugin.addDirectoryItem(HANDLE, url, li, isFolder=False)
        xbmcplugin.endOfDirectory(HANDLE)


def router(params):
    mode = params.get('mode', 'root')

    if mode == 'root':
        list_categories()
    elif mode == 'movies':
        list_movies()
    elif mode == 'play':
        play_movie(params.get('slug', ''), params.get('id', ''))
    elif mode == 'search':
        search()
    else:
        list_categories()


if __name__ == '__main__':
    params = dict(parse_qsl(sys.argv[2][1:]))  # strip leading '?'
    router(params)
