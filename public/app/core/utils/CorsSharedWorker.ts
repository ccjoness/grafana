// works with webpack plugin: scripts/webpack/plugins/CorsWorkerPlugin.js
export class CorsSharedWorker extends SharedWorker {
  constructor(url: URL, options?: WorkerOptions) {
    // by default, worker inherits HTML document's location and pathname which leads to wrong public path value
    // the CorsWorkerPlugin will override it with the value based on the initial worker chunk, ie.
    //    initial worker chunk: http://host.com/cdn/scripts/worker-123.js
    //    resulting public path: http://host.com/cdn/scripts

    const scriptUrl = url.toString();
    const urlParts = scriptUrl.split('/');
    urlParts.pop();
    const scriptsBasePathUrl = `${urlParts.join('/')}/`;

    // DOES NOT WORK
    // Worker created using "data:application/javascript" will have a null origin https://stackoverflow.com/questions/42239643/when-do-browsers-send-the-origin-header-when-do-browsers-set-the-origin-to-null/42242802#42242802
    //  => grafana_session cookie will not be sent on Centrifuge.connect()
    const source = `__webpack_worker_public_path__ = '${scriptsBasePathUrl}'; importScripts('${scriptUrl}');`;
    super(`data:application/javascript;base64,${btoa(source)}`, options);
  }
}
