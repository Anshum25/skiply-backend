import { v4 as uuidv4 } from 'uuid';

export function generateQrCodeString() {
  return uuidv4();
}
