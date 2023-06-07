import path from 'node:path';
import { readdirSync, lstatSync } from 'node:fs';
import { DEFAULT_DECIMAL_PRECISION, NS_IN_ONE_MS, NS_IN_ONE_SECOND } from './constants';

/**
 * Returns an array of filePaths when given a target path, and a list of extensions to look for
 */
export const getFiles = (
  /** Relative or absolute path to directory to get all files from */
  dirPath: string,
  /** File extension(s) to include when filtering files, including the "." character is optional */
  extensions: string | string[] = [
    '.js',
    '.mjs',
    '.cjs',
    '.ts'
  ]
): string[] => {
  // First, resolve provided dirPath (relative/absolute)
  if (!path.isAbsolute(dirPath)) dirPath = path.resolve(dirPath);

  // Next, check if the path points to an existing directory,
  // and return an empty array if not
  if (!lstatSync(dirPath).isDirectory()) {
    return [];
  }

  // Resolve variable extensions input: string || string[]
  if (typeof extensions === 'string') extensions = [extensions];

  // Initialize our response array, holding all found files
  const filePaths = [];

  // Loop over all files in the dirPath, recursively
  for (let filePath of readdirSync(dirPath)) {
    // Resolve the absolute path to the file, and getting
    // file stats from FS
    filePath = path.resolve(dirPath, filePath);
    const stat = lstatSync(filePath);

    // If target is a directory, recursively keep
    // adding function results to the existing array
    if (stat.isDirectory()) filePaths.push(...getFiles(filePath, extensions));
    // Or if the target is a file, and has a whitelisted extension,
    // Include it in the final result
    else if (
      stat.isFile() &&
      extensions.find((ext) => filePath.endsWith(ext)) !== undefined &&
      !filePath.slice(
        filePath.lastIndexOf(path.sep) + 1, filePath.length
      ).startsWith('.')
    ) filePaths.push(filePath);
  }

  // Finally, return the array of file paths
  return filePaths;
};

/**
 * Represents a list of available byte sizes
 */
const byteSizes = [
  'Bytes',
  'KB',
  'MB',
  'GB',
  'TB'
];

/**
 * Resolves a number input into human-readable byte representation
 */
export const humanReadableBytes = (bytes: number): string => {
  // Early escape
  if (bytes === 0) return `0 ${byteSizes[0] as string}`;

  // Resolve output
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
  if (i === 0) return String(bytes) + ' ' + (byteSizes[i] ?? 'TB+');
  else return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + (byteSizes[i] ?? 'TB+');
};

/** Represent a Runtime duration response type */
export interface Runtime {
  seconds: string
  ms: string
  ns: bigint
}

/**
 * Get runtime since process.hrtime.bigint() - NOT process.hrtime()
 */
export const getRuntime = (hrtime: bigint, decimalPrecision = DEFAULT_DECIMAL_PRECISION): Runtime => {
  // Converting
  const inNS = process.hrtime.bigint() - hrtime;
  const nsNumber = Number(inNS);
  const inMS = (nsNumber / NS_IN_ONE_MS).toFixed(decimalPrecision);
  const InSeconds = (nsNumber / NS_IN_ONE_SECOND).toFixed(decimalPrecision);

  // Return the conversions
  return {
    seconds: InSeconds,
    ms: inMS,
    ns: inNS
  };
};
