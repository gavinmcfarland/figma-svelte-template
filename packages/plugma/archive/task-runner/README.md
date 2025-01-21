# Task Runner

## Usage

```js
import { Task, taskCaller as main } from './task-runner/taskrunner.js'

// Example usage
const command = 'dev' // or 'preview'

main((task, run) => {
    // Register 'first' task
    task('first', function* (opts) {
        yield log(`first: ${opts.val}, command: ${opts.command}`)
        return (opts.val *= 4)
    })

    // Register 'second' task
    task('second', function* (opts) {
        yield log(`second: ${opts.val}, command: ${opts.command}`)
        return (opts.val += 2)
    })

    // Example of running tasks based on the command
    switch (command) {
        case 'dev':
        case 'preview':
            // Using callback to run tasks serially via task.serial and forwarding options
            run(
                (opts) => {
                    serial(['first', 'second'], opts) // Pass options explicitly
                },
                { command, val: 10 }
            )
            break

        // Run a specific task by its name and forward options
        case 'runFirst':
            run('first', { val: 10, command }).then((result) => {
                console.log(`Result of first task: ${result}`)
            })
            break
    }
})
```
