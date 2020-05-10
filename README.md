# Copy Once Paste Anywhere - Clipboard Server Repo

## Introduction

We have built a solution for synchronizing the clipboard content (any copied text, or URL) across all the devices a user has logged in. There are two types of applications for users - Android app and [Web app](https://clipboard-sync-angular-app.appspot.com/). The user has to simply login to these devices in order to use our system. Whenever a user copies some text in any of their logged-in devices, it is copied on all of their other devices, ready to be pasted. This makes it much more convenient for users to transfer content from one device to another.

The is the GitHub repository of the backend service of our project. An instance of this server is running in this [URL](http://clipboard-syncronization-app.appspot.com/).

**For a full list of features and architecture description, please refer to this [README.md](https://github.com/OOAD-Semester-Project/android-app/blob/master/README.md) document.**

## Prerequisites

1. [Node.js](https://nodejs.org/en/download/) (12.16.2)
2. npm (Comes with Node.js)
2. [Docker](https://docs.docker.com/get-docker/) (optional)

## Installation

Use the below command in the project directory for installing the required packages and libraries.
```
npm install
```

## How to run
----
Go into the project directory and execute the below command to start the server.
```
npm start
```
The node server will start listening in the port `3010`.

