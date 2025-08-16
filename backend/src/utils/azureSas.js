// src/utils/azureSas.js
import crypto from 'crypto';
import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER;
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;

const sharedKey = (AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY)
  ? new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)
  : null;

export function isAzureConfigured() {
  return !!sharedKey && !!AZURE_STORAGE_CONTAINER && !!AZURE_STORAGE_ACCOUNT;
}

export function buildAudioUploadSAS(uid, contentType) {
  if (!isAzureConfigured()) throw new Error('Storage not configured');

  const allowed = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac'];
  if (!allowed.includes(contentType)) {
    const err = new Error('Unsupported content type');
    err.status = 400;
    throw err;
  }

  const ext =
    contentType.includes('wav') ? '.wav' :
    contentType.includes('flac') ? '.flac' :
    contentType.includes('mpeg') ? '.mp3' : '';

  const blobName = `${uid}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;

  const startsOn = new Date();
  const expiresOn = new Date(Date.now() + 15 * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: AZURE_STORAGE_CONTAINER,
      blobName,
      startsOn,
      expiresOn,
      permissions: BlobSASPermissions.parse('cw'),
      protocol: SASProtocol.Https,
    },
    sharedKey
  ).toString();

  const baseUrl = `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/${encodeURIComponent(blobName)}`;
  return { uploadUrl: `${baseUrl}?${sas}`, blobUrl: baseUrl };
}
