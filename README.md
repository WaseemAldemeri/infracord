# infracord

A declarative, infrastructure-as-code framework for Discord.js. Define your server's structure — categories, channels, and permissions — as a static TypeScript blueprint, and infracord ensures your live server always matches it.

## Why

Managing Discord server structure by hand doesn't scale. Channels get created inconsistently, permissions drift, and there's no source of truth. infracord treats your server layout the same way Terraform treats cloud infrastructure: you declare the desired state in code, and the framework reconciles it.

## How it works

You define a blueprint describing your server's categories, channels, and permission overrides. infracord compares that blueprint against the live Discord server and applies only the necessary changes — creating or updating resources to bring the server into sync.

Because the blueprint is plain TypeScript, you get full compile-time type safety and IDE autocompletion for all resource definitions.

## Status

Early development. Not ready for production use.

## License

MIT
