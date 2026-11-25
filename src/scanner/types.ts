export type ScannerProps = {
  /** Called once per read; the camera stops after a read and the user can start it again. */
  onCode: (barcode: string) => void;
};
