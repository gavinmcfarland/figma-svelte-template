import { copyFile, existsSync, mkdir, readdir } from 'node:fs';
import { join } from 'node:path';

// Source and destination directories
const sourceDir = join(process.cwd(), '../apps/dist');
const destDir = join(process.cwd(), 'apps');

// Ensure destination directory exists
if (!existsSync(destDir)) {
  mkdir(destDir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

// Copy all files from source to destination
readdir(sourceDir, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    const srcPath = join(sourceDir, file);
    const destPath = join(destDir, file);

    copyFile(srcPath, destPath, (err) => {
      if (err) throw err;
      console.log(`${file} was copied to ${destPath}`);
    });
  }
});
