# Advanced REST Client Core Library

The core library of the Advanced REST Client application. Targeted release: ARC v18.

Contains the core models, events, and logic related to ARC. This replaces the `events`, `lib`, and parts of `base` libraries.

> This is a work in progress.

## Purpose

The core library provides the libraries that ARC and related projects are re-using under the hood.

The library is structured as follows:

- models - the data model libraries providing the data schema definition for ARC and related projects and the common logic to manipulate the data
- runtime - the executable part of the library; contains classes that executes an HTTP request, runs a series of requests defined in a project, etc
- utilities - helper libraries that can be shared across the ARC ecosystem

## What it isn't

This library provides no user flows and any kind of UI. This is a core library to be used to build those.

## Runtime

These libraries can be run in a web browser, NodeJS, or both. By default this library exports the NodeJS interfaces. These are using native NodeJS APIs so they won't work in a web browser.
Libraries exported in the `browser.js` file are save to execute in a plain web environment.

Note that when using platforms like Electron you can use both when NodeJS APIs are exposed to the renderer process.

## Use cases

These libraries can be used, among others, to:

- create a very basic, developer oriented, API definition (not a specification)
- create lists of HTTP requests to be executed in an API tests
- create lists of HTTP requests to be executed in an API monitoring
- to share semi-ready documentation for an API (when API specification does not exist, otherwise you would use API Console by MuleSoft :)

## Community driven

The entire ARC project is community driven. We build tools for API developers to make them successful without investing into very expensive enterprise solutions. We are happy to hear from you. If your ideas can benefit the community we will implement them. That's on us. But you are welcome to clone the project, build your idea, and send us a PR. We will accept it if it won't influence the stability of the project and it's safe to marge with the main branch.