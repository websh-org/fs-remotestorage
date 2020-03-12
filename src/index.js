import {WebShellApp} from "@websh/web-shell-app";
import RemoteStorage from 'remotestoragejs';
import Widget from 'remotestorage-widget';
import "./index.css";

WebShellApp.manifest({
  "v": 0,
  "name": "RemoteStorage",
  "icon": "icon.svg",
  "description": "RemoteStorage.io",
  "version": "0.0.1",
  "license": "MIT",
  "homepage": "https://github.com/websh-org/fs-remotestorage#readme",
  "repository": "https://github.com/websh-org/fs-remotestorage.git",
  "api": {
    "fs": {
    }
  }
})


WebShellApp.on("connect",async ()=> {


  const remoteStorage = new RemoteStorage({ cache: false });
  remoteStorage.access.claim('documents', 'rw');
  const client = remoteStorage.scope('/documents/');
  
  const widget = new Widget(remoteStorage,{leaveOpen:true,skipInitial:true});
  widget.attach('widget');
  
  remoteStorage.on('connected', async function () {
    WebShellApp.trigger("fs-mounted",{
      user:remoteStorage.remote.userAddress,
      reconnect: {
        token: remoteStorage.remote.token
      }
    })
  });
  
  remoteStorage.on('disconnected', async function () {
    WebShellApp.trigger("fs-unmounted",{})
  });
  

  async function list(fid) {
    const listing = await client.getListing(fid);
    console.log(listing)
    const files = Object.entries(listing).map(([key, value]) => {
      const file = {
        fid: fid + key,
        name: key.replace(/[/]$/, ''),
        pid: fid,
        is: {}
      }
      if (value === true) {
        file.type = "folder/directory";
        file.is.folder = true;
        return file;
      }
      file.is.file = true;
      file.type = value["Content-Type"];
      file.size = value["Content-Length"];
      file.ctime = value["Last-Modified"];
      return file;
    })
    return {
      fid,
      pid: fid.split('/').slice(0, -2).join("") + "/",
      name: fid.split('/').slice(-2, -1).join(""),
      type: 'folder/directory',
      is: { directory: true },
      files
    }
  }
  
  async function get(fid) {
    const res = await client.getFile(fid);
    const blob = new Blob([res.data], { type: res.mimeType });
    const file = {
      fid,
      pid: fid.split('/').slice(0, -1).join("") + "/",
      is: { file: true },
      content: blob,
      size: blob.size,
      type: res.mimeType,
    }
    return file;
  }
})
