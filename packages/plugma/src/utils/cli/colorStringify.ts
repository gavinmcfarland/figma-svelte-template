import chalk from 'chalk';

// Color and format string
export function colorStringify(
  obj: object,
  indent = 2,
): string {
  const spaces = ' '.repeat(indent);

  const formatted = Object.entries(obj)
    .map(([key, value]) => {
      let coloredValue: string;
      if (typeof value === 'number') {
        coloredValue = chalk.yellow(value.toString());
      } else if (typeof value === 'string') {
        coloredValue = chalk.green(`"${value}"`);
      } else if (typeof value === 'boolean') {
        coloredValue = value
          ? chalk.blue(value.toString())
          : chalk.red(value.toString());
      } else {
        coloredValue = String(value);
      }
      return `${spaces}${key}: ${coloredValue}`;
    })
    .join(',\n');

  return `{\n${formatted}\n}`;
}
