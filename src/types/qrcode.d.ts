declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeModule {
    toDataURL(
      text: string,
      options?: QRCodeToDataURLOptions
    ): Promise<string>;
  }

  const QRCode: QRCodeModule;
  export default QRCode;
}
