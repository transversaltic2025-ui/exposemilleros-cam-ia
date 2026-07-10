export const PROJECT_DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;
export const PROJECT_POSTER_MAX_BYTES = 3 * 1024 * 1024;
export const MINOR_CONSENT_MAX_BYTES = 5 * 1024 * 1024;

export const allowedProjectDocumentMimeTypes = ["application/pdf"] as const;
export const allowedMinorConsentMimeTypes = ["application/pdf"] as const;
export const allowedPosterMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const allowedProjectDocumentExtensions = [".pdf"] as const;
export const allowedMinorConsentExtensions = [".pdf"] as const;
export const allowedPosterExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"] as const;

const editableDocumentExtensions = new Set([
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".odt",
  ".odp",
  ".zip",
  ".rar",
]);

const editablePosterExtensions = new Set([
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".ai",
  ".psd",
  ".zip",
  ".rar",
]);

export interface FileMetadataInput {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  reason?: "size" | "mime" | "extension" | "editable";
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function getFileExtension(fileName: string) {
  const cleanName = fileName.trim().toLowerCase();
  const dotIndex = cleanName.lastIndexOf(".");

  if (dotIndex < 0 || dotIndex === cleanName.length - 1) {
    return "";
  }

  return cleanName.slice(dotIndex);
}

export function validateProjectDocumentFile(file: File) {
  return validateProjectDocumentMetadata({
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
}

export function validatePosterFile(file: File) {
  return validatePosterMetadata({
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
}

export function validateMinorConsentFile(file: File) {
  return validateMinorConsentMetadata({
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
}

export function validateProjectDocumentMetadata({
  fileName,
  contentType,
  fileSize,
}: FileMetadataInput): FileValidationResult {
  const extension = getFileExtension(fileName);

  if (fileSize > PROJECT_DOCUMENT_MAX_BYTES) {
    return {
      valid: false,
      error: "El archivo supera el límite de 8 MB.",
      reason: "size",
    };
  }

  if (editableDocumentExtensions.has(extension)) {
    return {
      valid: false,
      error: "No se permiten formatos editables. Exporte el documento como PDF.",
      reason: "editable",
    };
  }

  if (!allowedProjectDocumentMimeTypes.includes(contentType as typeof allowedProjectDocumentMimeTypes[number])) {
    return {
      valid: false,
      error: "El documento del proyecto debe estar en PDF.",
      reason: "mime",
    };
  }

  if (!allowedProjectDocumentExtensions.includes(extension as typeof allowedProjectDocumentExtensions[number])) {
    return {
      valid: false,
      error: "El documento del proyecto debe estar en PDF.",
      reason: "extension",
    };
  }

  return { valid: true };
}

export function validateMinorConsentMetadata({
  fileName,
  contentType,
  fileSize,
}: FileMetadataInput): FileValidationResult {
  const extension = getFileExtension(fileName);

  if (fileSize > MINOR_CONSENT_MAX_BYTES) {
    return {
      valid: false,
      error: "La autorización para tratamiento de datos del menor de edad supera el límite de 5 MB.",
      reason: "size",
    };
  }

  if (editableDocumentExtensions.has(extension)) {
    return {
      valid: false,
      error: "La autorización para tratamiento de datos del menor de edad debe estar en PDF.",
      reason: "editable",
    };
  }

  if (!allowedMinorConsentMimeTypes.includes(contentType as typeof allowedMinorConsentMimeTypes[number])) {
    return {
      valid: false,
      error: "La autorización para tratamiento de datos del menor de edad debe estar en PDF.",
      reason: "mime",
    };
  }

  if (!allowedMinorConsentExtensions.includes(extension as typeof allowedMinorConsentExtensions[number])) {
    return {
      valid: false,
      error: "La autorización para tratamiento de datos del menor de edad debe estar en PDF.",
      reason: "extension",
    };
  }

  return { valid: true };
}

export function validatePosterMetadata({
  fileName,
  contentType,
  fileSize,
}: FileMetadataInput): FileValidationResult {
  const extension = getFileExtension(fileName);

  if (fileSize > PROJECT_POSTER_MAX_BYTES) {
    return {
      valid: false,
      error: "El póster supera el límite de 3 MB.",
      reason: "size",
    };
  }

  if (editablePosterExtensions.has(extension)) {
    return {
      valid: false,
      error: "No se permiten formatos editables. Exporte el póster como PDF o imagen.",
      reason: "editable",
    };
  }

  if (!allowedPosterMimeTypes.includes(contentType as typeof allowedPosterMimeTypes[number])) {
    return {
      valid: false,
      error: "El póster solo puede ser PDF, JPG, PNG o WEBP.",
      reason: "mime",
    };
  }

  if (!allowedPosterExtensions.includes(extension as typeof allowedPosterExtensions[number])) {
    return {
      valid: false,
      error: "El póster solo puede ser PDF, JPG, PNG o WEBP.",
      reason: "extension",
    };
  }

  return { valid: true };
}
