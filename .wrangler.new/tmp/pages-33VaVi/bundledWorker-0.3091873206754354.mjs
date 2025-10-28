var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x2, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js
var is = Object.defineProperty;
var gt = /* @__PURE__ */ __name((s) => {
  throw TypeError(s);
}, "gt");
var cs = /* @__PURE__ */ __name((s, e, t) => e in s ? is(s, e, { enumerable: true, configurable: true, writable: true, value: t }) : s[e] = t, "cs");
var E = /* @__PURE__ */ __name((s, e, t) => cs(s, typeof e != "symbol" ? e + "" : e, t), "E");
var tt = /* @__PURE__ */ __name((s, e, t) => e.has(s) || gt("Cannot " + t), "tt");
var h = /* @__PURE__ */ __name((s, e, t) => (tt(s, e, "read from private field"), t ? t.call(s) : e.get(s)), "h");
var C = /* @__PURE__ */ __name((s, e, t) => e.has(s) ? gt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(s) : e.set(s, t), "C");
var x = /* @__PURE__ */ __name((s, e, t, r) => (tt(s, e, "write to private field"), r ? r.call(s, t) : e.set(s, t), t), "x");
var O = /* @__PURE__ */ __name((s, e, t) => (tt(s, e, "access private method"), t), "O");
var ht = /* @__PURE__ */ __name((s, e, t, r) => ({ set _(o) {
  x(s, e, o, t);
}, get _() {
  return h(s, e, r);
} }), "ht");
var pt = /* @__PURE__ */ __name((s, e, t) => (r, o) => {
  let n = -1;
  return a(0);
  async function a(c) {
    if (c <= n) throw new Error("next() called multiple times");
    n = c;
    let i, l = false, u;
    if (s[c] ? (u = s[c][0][0], r.req.routeIndex = c) : u = c === s.length && o || void 0, u) try {
      i = await u(r, () => a(c + 1));
    } catch (d) {
      if (d instanceof Error && e) r.error = d, i = await e(d, r), l = true;
      else throw d;
    }
    else r.finalized === false && t && (i = await t(r));
    return i && (r.finalized === false || l) && (r.res = i), r;
  }
  __name(a, "a");
}, "pt");
var ls = Symbol();
var us = /* @__PURE__ */ __name(async (s, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: t = false, dot: r = false } = e, n = (s instanceof It ? s.raw.headers : s.headers).get("Content-Type");
  return n != null && n.startsWith("multipart/form-data") || n != null && n.startsWith("application/x-www-form-urlencoded") ? ds(s, { all: t, dot: r }) : {};
}, "us");
async function ds(s, e) {
  const t = await s.formData();
  return t ? gs(t, e) : {};
}
__name(ds, "ds");
function gs(s, e) {
  const t = /* @__PURE__ */ Object.create(null);
  return s.forEach((r, o) => {
    e.all || o.endsWith("[]") ? hs(t, o, r) : t[o] = r;
  }), e.dot && Object.entries(t).forEach(([r, o]) => {
    r.includes(".") && (ps(t, r, o), delete t[r]);
  }), t;
}
__name(gs, "gs");
var hs = /* @__PURE__ */ __name((s, e, t) => {
  s[e] !== void 0 ? Array.isArray(s[e]) ? s[e].push(t) : s[e] = [s[e], t] : e.endsWith("[]") ? s[e] = [t] : s[e] = t;
}, "hs");
var ps = /* @__PURE__ */ __name((s, e, t) => {
  let r = s;
  const o = e.split(".");
  o.forEach((n, a) => {
    a === o.length - 1 ? r[n] = t : ((!r[n] || typeof r[n] != "object" || Array.isArray(r[n]) || r[n] instanceof File) && (r[n] = /* @__PURE__ */ Object.create(null)), r = r[n]);
  });
}, "ps");
var Dt = /* @__PURE__ */ __name((s) => {
  const e = s.split("/");
  return e[0] === "" && e.shift(), e;
}, "Dt");
var ms = /* @__PURE__ */ __name((s) => {
  const { groups: e, path: t } = _s(s), r = Dt(t);
  return ys(r, e);
}, "ms");
var _s = /* @__PURE__ */ __name((s) => {
  const e = [];
  return s = s.replace(/\{[^}]+\}/g, (t, r) => {
    const o = `@${r}`;
    return e.push([o, t]), o;
  }), { groups: e, path: s };
}, "_s");
var ys = /* @__PURE__ */ __name((s, e) => {
  for (let t = e.length - 1; t >= 0; t--) {
    const [r] = e[t];
    for (let o = s.length - 1; o >= 0; o--) if (s[o].includes(r)) {
      s[o] = s[o].replace(r, e[t][1]);
      break;
    }
  }
  return s;
}, "ys");
var We = {};
var fs = /* @__PURE__ */ __name((s, e) => {
  if (s === "*") return "*";
  const t = s.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (t) {
    const r = `${s}#${e}`;
    return We[r] || (t[2] ? We[r] = e && e[0] !== ":" && e[0] !== "*" ? [r, t[1], new RegExp(`^${t[2]}(?=/${e})`)] : [s, t[1], new RegExp(`^${t[2]}$`)] : We[r] = [s, t[1], true]), We[r];
  }
  return null;
}, "fs");
var at = /* @__PURE__ */ __name((s, e) => {
  try {
    return e(s);
  } catch {
    return s.replace(/(?:%[0-9A-Fa-f]{2})+/g, (t) => {
      try {
        return e(t);
      } catch {
        return t;
      }
    });
  }
}, "at");
var bs = /* @__PURE__ */ __name((s) => at(s, decodeURI), "bs");
var At = /* @__PURE__ */ __name((s) => {
  const e = s.url, t = e.indexOf("/", e.indexOf(":") + 4);
  let r = t;
  for (; r < e.length; r++) {
    const o = e.charCodeAt(r);
    if (o === 37) {
      const n = e.indexOf("?", r), a = e.slice(t, n === -1 ? void 0 : n);
      return bs(a.includes("%25") ? a.replace(/%25/g, "%2525") : a);
    } else if (o === 63) break;
  }
  return e.slice(t, r);
}, "At");
var vs = /* @__PURE__ */ __name((s) => {
  const e = At(s);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, "vs");
var Ee = /* @__PURE__ */ __name((s, e, ...t) => (t.length && (e = Ee(e, ...t)), `${(s == null ? void 0 : s[0]) === "/" ? "" : "/"}${s}${e === "/" ? "" : `${(s == null ? void 0 : s.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), "Ee");
var Ot = /* @__PURE__ */ __name((s) => {
  if (s.charCodeAt(s.length - 1) !== 63 || !s.includes(":")) return null;
  const e = s.split("/"), t = [];
  let r = "";
  return e.forEach((o) => {
    if (o !== "" && !/\:/.test(o)) r += "/" + o;
    else if (/\:/.test(o)) if (/\?/.test(o)) {
      t.length === 0 && r === "" ? t.push("/") : t.push(r);
      const n = o.replace("?", "");
      r += "/" + n, t.push(r);
    } else r += "/" + o;
  }), t.filter((o, n, a) => a.indexOf(o) === n);
}, "Ot");
var st = /* @__PURE__ */ __name((s) => /[%+]/.test(s) ? (s.indexOf("+") !== -1 && (s = s.replace(/\+/g, " ")), s.indexOf("%") !== -1 ? at(s, jt) : s) : s, "st");
var Pt = /* @__PURE__ */ __name((s, e, t) => {
  let r;
  if (!t && e && !/[%+]/.test(e)) {
    let a = s.indexOf(`?${e}`, 8);
    for (a === -1 && (a = s.indexOf(`&${e}`, 8)); a !== -1; ) {
      const c = s.charCodeAt(a + e.length + 1);
      if (c === 61) {
        const i = a + e.length + 2, l = s.indexOf("&", i);
        return st(s.slice(i, l === -1 ? void 0 : l));
      } else if (c == 38 || isNaN(c)) return "";
      a = s.indexOf(`&${e}`, a + 1);
    }
    if (r = /[%+]/.test(s), !r) return;
  }
  const o = {};
  r ?? (r = /[%+]/.test(s));
  let n = s.indexOf("?", 8);
  for (; n !== -1; ) {
    const a = s.indexOf("&", n + 1);
    let c = s.indexOf("=", n);
    c > a && a !== -1 && (c = -1);
    let i = s.slice(n + 1, c === -1 ? a === -1 ? void 0 : a : c);
    if (r && (i = st(i)), n = a, i === "") continue;
    let l;
    c === -1 ? l = "" : (l = s.slice(c + 1, a === -1 ? void 0 : a), r && (l = st(l))), t ? (o[i] && Array.isArray(o[i]) || (o[i] = []), o[i].push(l)) : o[i] ?? (o[i] = l);
  }
  return e ? o[e] : o;
}, "Pt");
var ws = Pt;
var Ss = /* @__PURE__ */ __name((s, e) => Pt(s, e, true), "Ss");
var jt = decodeURIComponent;
var mt = /* @__PURE__ */ __name((s) => at(s, jt), "mt");
var xe;
var V;
var se;
var Mt;
var Lt;
var nt;
var re;
var bt;
var It = (bt = class {
  static {
    __name(this, "bt");
  }
  constructor(s, e = "/", t = [[]]) {
    C(this, se);
    E(this, "raw");
    C(this, xe);
    C(this, V);
    E(this, "routeIndex", 0);
    E(this, "path");
    E(this, "bodyCache", {});
    C(this, re, (s2) => {
      const { bodyCache: e2, raw: t2 } = this, r = e2[s2];
      if (r) return r;
      const o = Object.keys(e2)[0];
      return o ? e2[o].then((n) => (o === "json" && (n = JSON.stringify(n)), new Response(n)[s2]())) : e2[s2] = t2[s2]();
    });
    this.raw = s, this.path = e, x(this, V, t), x(this, xe, {});
  }
  param(s) {
    return s ? O(this, se, Mt).call(this, s) : O(this, se, Lt).call(this);
  }
  query(s) {
    return ws(this.url, s);
  }
  queries(s) {
    return Ss(this.url, s);
  }
  header(s) {
    if (s) return this.raw.headers.get(s) ?? void 0;
    const e = {};
    return this.raw.headers.forEach((t, r) => {
      e[r] = t;
    }), e;
  }
  async parseBody(s) {
    var e;
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await us(this, s));
  }
  json() {
    return h(this, re).call(this, "text").then((s) => JSON.parse(s));
  }
  text() {
    return h(this, re).call(this, "text");
  }
  arrayBuffer() {
    return h(this, re).call(this, "arrayBuffer");
  }
  blob() {
    return h(this, re).call(this, "blob");
  }
  formData() {
    return h(this, re).call(this, "formData");
  }
  addValidatedData(s, e) {
    h(this, xe)[s] = e;
  }
  valid(s) {
    return h(this, xe)[s];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [ls]() {
    return h(this, V);
  }
  get matchedRoutes() {
    return h(this, V)[0].map(([[, s]]) => s);
  }
  get routePath() {
    return h(this, V)[0].map(([[, s]]) => s)[this.routeIndex].path;
  }
}, xe = /* @__PURE__ */ new WeakMap(), V = /* @__PURE__ */ new WeakMap(), se = /* @__PURE__ */ new WeakSet(), Mt = /* @__PURE__ */ __name(function(s) {
  const e = h(this, V)[0][this.routeIndex][1][s], t = O(this, se, nt).call(this, e);
  return t && /\%/.test(t) ? mt(t) : t;
}, "Mt"), Lt = /* @__PURE__ */ __name(function() {
  const s = {}, e = Object.keys(h(this, V)[0][this.routeIndex][1]);
  for (const t of e) {
    const r = O(this, se, nt).call(this, h(this, V)[0][this.routeIndex][1][t]);
    r !== void 0 && (s[t] = /\%/.test(r) ? mt(r) : r);
  }
  return s;
}, "Lt"), nt = /* @__PURE__ */ __name(function(s) {
  return h(this, V)[1] ? h(this, V)[1][s] : s;
}, "nt"), re = /* @__PURE__ */ new WeakMap(), bt);
var Es = { Stringify: 1 };
var Ft = /* @__PURE__ */ __name(async (s, e, t, r, o) => {
  typeof s == "object" && !(s instanceof String) && (s instanceof Promise || (s = s.toString()), s instanceof Promise && (s = await s));
  const n = s.callbacks;
  return n != null && n.length ? (o ? o[0] += s : o = [s], Promise.all(n.map((c) => c({ phase: e, buffer: o, context: r }))).then((c) => Promise.all(c.filter(Boolean).map((i) => Ft(i, e, false, r, o))).then(() => o[0]))) : Promise.resolve(s);
}, "Ft");
var Ts = "text/plain; charset=UTF-8";
var rt = /* @__PURE__ */ __name((s, e) => ({ "Content-Type": s, ...e }), "rt");
var Le;
var Fe;
var Z;
var Ce;
var Q;
var U;
var Ne;
var De;
var Ae;
var he;
var Be;
var $e;
var ne;
var Te;
var vt;
var Rs = (vt = class {
  static {
    __name(this, "vt");
  }
  constructor(s, e) {
    C(this, ne);
    C(this, Le);
    C(this, Fe);
    E(this, "env", {});
    C(this, Z);
    E(this, "finalized", false);
    E(this, "error");
    C(this, Ce);
    C(this, Q);
    C(this, U);
    C(this, Ne);
    C(this, De);
    C(this, Ae);
    C(this, he);
    C(this, Be);
    C(this, $e);
    E(this, "render", (...s2) => (h(this, De) ?? x(this, De, (e2) => this.html(e2)), h(this, De).call(this, ...s2)));
    E(this, "setLayout", (s2) => x(this, Ne, s2));
    E(this, "getLayout", () => h(this, Ne));
    E(this, "setRenderer", (s2) => {
      x(this, De, s2);
    });
    E(this, "header", (s2, e2, t) => {
      this.finalized && x(this, U, new Response(h(this, U).body, h(this, U)));
      const r = h(this, U) ? h(this, U).headers : h(this, he) ?? x(this, he, new Headers());
      e2 === void 0 ? r.delete(s2) : t != null && t.append ? r.append(s2, e2) : r.set(s2, e2);
    });
    E(this, "status", (s2) => {
      x(this, Ce, s2);
    });
    E(this, "set", (s2, e2) => {
      h(this, Z) ?? x(this, Z, /* @__PURE__ */ new Map()), h(this, Z).set(s2, e2);
    });
    E(this, "get", (s2) => h(this, Z) ? h(this, Z).get(s2) : void 0);
    E(this, "newResponse", (...s2) => O(this, ne, Te).call(this, ...s2));
    E(this, "body", (s2, e2, t) => O(this, ne, Te).call(this, s2, e2, t));
    E(this, "text", (s2, e2, t) => !h(this, he) && !h(this, Ce) && !e2 && !t && !this.finalized ? new Response(s2) : O(this, ne, Te).call(this, s2, e2, rt(Ts, t)));
    E(this, "json", (s2, e2, t) => O(this, ne, Te).call(this, JSON.stringify(s2), e2, rt("application/json", t)));
    E(this, "html", (s2, e2, t) => {
      const r = /* @__PURE__ */ __name((o) => O(this, ne, Te).call(this, o, e2, rt("text/html; charset=UTF-8", t)), "r");
      return typeof s2 == "object" ? Ft(s2, Es.Stringify, false, {}).then(r) : r(s2);
    });
    E(this, "redirect", (s2, e2) => {
      const t = String(s2);
      return this.header("Location", /[^\x00-\xFF]/.test(t) ? encodeURI(t) : t), this.newResponse(null, e2 ?? 302);
    });
    E(this, "notFound", () => (h(this, Ae) ?? x(this, Ae, () => new Response()), h(this, Ae).call(this, this)));
    x(this, Le, s), e && (x(this, Q, e.executionCtx), this.env = e.env, x(this, Ae, e.notFoundHandler), x(this, $e, e.path), x(this, Be, e.matchResult));
  }
  get req() {
    return h(this, Fe) ?? x(this, Fe, new It(h(this, Le), h(this, $e), h(this, Be))), h(this, Fe);
  }
  get event() {
    if (h(this, Q) && "respondWith" in h(this, Q)) return h(this, Q);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (h(this, Q)) return h(this, Q);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return h(this, U) || x(this, U, new Response(null, { headers: h(this, he) ?? x(this, he, new Headers()) }));
  }
  set res(s) {
    if (h(this, U) && s) {
      s = new Response(s.body, s);
      for (const [e, t] of h(this, U).headers.entries()) if (e !== "content-type") if (e === "set-cookie") {
        const r = h(this, U).headers.getSetCookie();
        s.headers.delete("set-cookie");
        for (const o of r) s.headers.append("set-cookie", o);
      } else s.headers.set(e, t);
    }
    x(this, U, s), this.finalized = true;
  }
  get var() {
    return h(this, Z) ? Object.fromEntries(h(this, Z)) : {};
  }
}, Le = /* @__PURE__ */ new WeakMap(), Fe = /* @__PURE__ */ new WeakMap(), Z = /* @__PURE__ */ new WeakMap(), Ce = /* @__PURE__ */ new WeakMap(), Q = /* @__PURE__ */ new WeakMap(), U = /* @__PURE__ */ new WeakMap(), Ne = /* @__PURE__ */ new WeakMap(), De = /* @__PURE__ */ new WeakMap(), Ae = /* @__PURE__ */ new WeakMap(), he = /* @__PURE__ */ new WeakMap(), Be = /* @__PURE__ */ new WeakMap(), $e = /* @__PURE__ */ new WeakMap(), ne = /* @__PURE__ */ new WeakSet(), Te = /* @__PURE__ */ __name(function(s, e, t) {
  const r = h(this, U) ? new Headers(h(this, U).headers) : h(this, he) ?? new Headers();
  if (typeof e == "object" && "headers" in e) {
    const n = e.headers instanceof Headers ? e.headers : new Headers(e.headers);
    for (const [a, c] of n) a.toLowerCase() === "set-cookie" ? r.append(a, c) : r.set(a, c);
  }
  if (t) for (const [n, a] of Object.entries(t)) if (typeof a == "string") r.set(n, a);
  else {
    r.delete(n);
    for (const c of a) r.append(n, c);
  }
  const o = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? h(this, Ce);
  return new Response(s, { status: o, headers: r });
}, "Te"), vt);
var M = "ALL";
var xs = "all";
var Cs = ["get", "post", "put", "delete", "options", "patch"];
var Nt = "Can not add a route since the matcher is already built.";
var Bt = class extends Error {
  static {
    __name(this, "Bt");
  }
};
var Ds = "__COMPOSED_HANDLER";
var As = /* @__PURE__ */ __name((s) => s.text("404 Not Found", 404), "As");
var _t = /* @__PURE__ */ __name((s, e) => {
  if ("getResponse" in s) {
    const t = s.getResponse();
    return e.newResponse(t.body, t);
  }
  return console.error(s), e.text("Internal Server Error", 500);
}, "_t");
var K;
var L;
var kt;
var G;
var ue;
var Ve;
var Ke;
var wt;
var $t = (wt = class {
  static {
    __name(this, "wt");
  }
  constructor(e = {}) {
    C(this, L);
    E(this, "get");
    E(this, "post");
    E(this, "put");
    E(this, "delete");
    E(this, "options");
    E(this, "patch");
    E(this, "all");
    E(this, "on");
    E(this, "use");
    E(this, "router");
    E(this, "getPath");
    E(this, "_basePath", "/");
    C(this, K, "/");
    E(this, "routes", []);
    C(this, G, As);
    E(this, "errorHandler", _t);
    E(this, "onError", (e2) => (this.errorHandler = e2, this));
    E(this, "notFound", (e2) => (x(this, G, e2), this));
    E(this, "fetch", (e2, ...t) => O(this, L, Ke).call(this, e2, t[1], t[0], e2.method));
    E(this, "request", (e2, t, r2, o2) => e2 instanceof Request ? this.fetch(t ? new Request(e2, t) : e2, r2, o2) : (e2 = e2.toString(), this.fetch(new Request(/^https?:\/\//.test(e2) ? e2 : `http://localhost${Ee("/", e2)}`, t), r2, o2)));
    E(this, "fire", () => {
      addEventListener("fetch", (e2) => {
        e2.respondWith(O(this, L, Ke).call(this, e2.request, e2, void 0, e2.request.method));
      });
    });
    [...Cs, xs].forEach((n) => {
      this[n] = (a, ...c) => (typeof a == "string" ? x(this, K, a) : O(this, L, ue).call(this, n, h(this, K), a), c.forEach((i) => {
        O(this, L, ue).call(this, n, h(this, K), i);
      }), this);
    }), this.on = (n, a, ...c) => {
      for (const i of [a].flat()) {
        x(this, K, i);
        for (const l of [n].flat()) c.map((u) => {
          O(this, L, ue).call(this, l.toUpperCase(), h(this, K), u);
        });
      }
      return this;
    }, this.use = (n, ...a) => (typeof n == "string" ? x(this, K, n) : (x(this, K, "*"), a.unshift(n)), a.forEach((c) => {
      O(this, L, ue).call(this, M, h(this, K), c);
    }), this);
    const { strict: r, ...o } = e;
    Object.assign(this, o), this.getPath = r ?? true ? e.getPath ?? At : vs;
  }
  route(e, t) {
    const r = this.basePath(e);
    return t.routes.map((o) => {
      var a;
      let n;
      t.errorHandler === _t ? n = o.handler : (n = /* @__PURE__ */ __name(async (c, i) => (await pt([], t.errorHandler)(c, () => o.handler(c, i))).res, "n"), n[Ds] = o.handler), O(a = r, L, ue).call(a, o.method, o.path, n);
    }), this;
  }
  basePath(e) {
    const t = O(this, L, kt).call(this);
    return t._basePath = Ee(this._basePath, e), t;
  }
  mount(e, t, r) {
    let o, n;
    r && (typeof r == "function" ? n = r : (n = r.optionHandler, r.replaceRequest === false ? o = /* @__PURE__ */ __name((i) => i, "o") : o = r.replaceRequest));
    const a = n ? (i) => {
      const l = n(i);
      return Array.isArray(l) ? l : [l];
    } : (i) => {
      let l;
      try {
        l = i.executionCtx;
      } catch {
      }
      return [i.env, l];
    };
    o || (o = (() => {
      const i = Ee(this._basePath, e), l = i === "/" ? 0 : i.length;
      return (u) => {
        const d = new URL(u.url);
        return d.pathname = d.pathname.slice(l) || "/", new Request(d, u);
      };
    })());
    const c = /* @__PURE__ */ __name(async (i, l) => {
      const u = await t(o(i.req.raw), ...a(i));
      if (u) return u;
      await l();
    }, "c");
    return O(this, L, ue).call(this, M, Ee(e, "*"), c), this;
  }
}, K = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new WeakSet(), kt = /* @__PURE__ */ __name(function() {
  const e = new $t({ router: this.router, getPath: this.getPath });
  return e.errorHandler = this.errorHandler, x(e, G, h(this, G)), e.routes = this.routes, e;
}, "kt"), G = /* @__PURE__ */ new WeakMap(), ue = /* @__PURE__ */ __name(function(e, t, r) {
  e = e.toUpperCase(), t = Ee(this._basePath, t);
  const o = { basePath: this._basePath, path: t, method: e, handler: r };
  this.router.add(e, t, [r, o]), this.routes.push(o);
}, "ue"), Ve = /* @__PURE__ */ __name(function(e, t) {
  if (e instanceof Error) return this.errorHandler(e, t);
  throw e;
}, "Ve"), Ke = /* @__PURE__ */ __name(function(e, t, r, o) {
  if (o === "HEAD") return (async () => new Response(null, await O(this, L, Ke).call(this, e, t, r, "GET")))();
  const n = this.getPath(e, { env: r }), a = this.router.match(o, n), c = new Rs(e, { path: n, matchResult: a, env: r, executionCtx: t, notFoundHandler: h(this, G) });
  if (a[0].length === 1) {
    let l;
    try {
      l = a[0][0][0][0](c, async () => {
        c.res = await h(this, G).call(this, c);
      });
    } catch (u) {
      return O(this, L, Ve).call(this, u, c);
    }
    return l instanceof Promise ? l.then((u) => u || (c.finalized ? c.res : h(this, G).call(this, c))).catch((u) => O(this, L, Ve).call(this, u, c)) : l ?? h(this, G).call(this, c);
  }
  const i = pt(a[0], this.errorHandler, h(this, G));
  return (async () => {
    try {
      const l = await i(c);
      if (!l.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
      return l.res;
    } catch (l) {
      return O(this, L, Ve).call(this, l, c);
    }
  })();
}, "Ke"), wt);
var Ht = [];
function Os(s, e) {
  const t = this.buildAllMatchers(), r = /* @__PURE__ */ __name((o, n) => {
    const a = t[o] || t[M], c = a[2][n];
    if (c) return c;
    const i = n.match(a[0]);
    if (!i) return [[], Ht];
    const l = i.indexOf("", 1);
    return [a[1][l], i];
  }, "r");
  return this.match = r, r(s, e);
}
__name(Os, "Os");
var ze = "[^/]+";
var Ie = ".*";
var Me = "(?:|/.*)";
var Re = Symbol();
var Ps = new Set(".\\+*[^]$()");
function js(s, e) {
  return s.length === 1 ? e.length === 1 ? s < e ? -1 : 1 : -1 : e.length === 1 || s === Ie || s === Me ? 1 : e === Ie || e === Me ? -1 : s === ze ? 1 : e === ze ? -1 : s.length === e.length ? s < e ? -1 : 1 : e.length - s.length;
}
__name(js, "js");
var pe;
var me;
var Y;
var St;
var ot = (St = class {
  static {
    __name(this, "St");
  }
  constructor() {
    C(this, pe);
    C(this, me);
    C(this, Y, /* @__PURE__ */ Object.create(null));
  }
  insert(e, t, r, o, n) {
    if (e.length === 0) {
      if (h(this, pe) !== void 0) throw Re;
      if (n) return;
      x(this, pe, t);
      return;
    }
    const [a, ...c] = e, i = a === "*" ? c.length === 0 ? ["", "", Ie] : ["", "", ze] : a === "/*" ? ["", "", Me] : a.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (i) {
      const u = i[1];
      let d = i[2] || ze;
      if (u && i[2] && (d === ".*" || (d = d.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(d)))) throw Re;
      if (l = h(this, Y)[d], !l) {
        if (Object.keys(h(this, Y)).some((g) => g !== Ie && g !== Me)) throw Re;
        if (n) return;
        l = h(this, Y)[d] = new ot(), u !== "" && x(l, me, o.varIndex++);
      }
      !n && u !== "" && r.push([u, h(l, me)]);
    } else if (l = h(this, Y)[a], !l) {
      if (Object.keys(h(this, Y)).some((u) => u.length > 1 && u !== Ie && u !== Me)) throw Re;
      if (n) return;
      l = h(this, Y)[a] = new ot();
    }
    l.insert(c, t, r, o, n);
  }
  buildRegExpStr() {
    const t = Object.keys(h(this, Y)).sort(js).map((r) => {
      const o = h(this, Y)[r];
      return (typeof h(o, me) == "number" ? `(${r})@${h(o, me)}` : Ps.has(r) ? `\\${r}` : r) + o.buildRegExpStr();
    });
    return typeof h(this, pe) == "number" && t.unshift(`#${h(this, pe)}`), t.length === 0 ? "" : t.length === 1 ? t[0] : "(?:" + t.join("|") + ")";
  }
}, pe = /* @__PURE__ */ new WeakMap(), me = /* @__PURE__ */ new WeakMap(), Y = /* @__PURE__ */ new WeakMap(), St);
var Je;
var ke;
var Et;
var Is = (Et = class {
  static {
    __name(this, "Et");
  }
  constructor() {
    C(this, Je, { varIndex: 0 });
    C(this, ke, new ot());
  }
  insert(s, e, t) {
    const r = [], o = [];
    for (let a = 0; ; ) {
      let c = false;
      if (s = s.replace(/\{[^}]+\}/g, (i) => {
        const l = `@\\${a}`;
        return o[a] = [l, i], a++, c = true, l;
      }), !c) break;
    }
    const n = s.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let a = o.length - 1; a >= 0; a--) {
      const [c] = o[a];
      for (let i = n.length - 1; i >= 0; i--) if (n[i].indexOf(c) !== -1) {
        n[i] = n[i].replace(c, o[a][1]);
        break;
      }
    }
    return h(this, ke).insert(n, e, r, h(this, Je), t), r;
  }
  buildRegExp() {
    let s = h(this, ke).buildRegExpStr();
    if (s === "") return [/^$/, [], []];
    let e = 0;
    const t = [], r = [];
    return s = s.replace(/#(\d+)|@(\d+)|\.\*\$/g, (o, n, a) => n !== void 0 ? (t[++e] = Number(n), "$()") : (a !== void 0 && (r[Number(a)] = ++e), "")), [new RegExp(`^${s}`), t, r];
  }
}, Je = /* @__PURE__ */ new WeakMap(), ke = /* @__PURE__ */ new WeakMap(), Et);
var Ms = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var Ge = /* @__PURE__ */ Object.create(null);
function Ut(s) {
  return Ge[s] ?? (Ge[s] = new RegExp(s === "*" ? "" : `^${s.replace(/\/\*$|([.\\+*[^\]$()])/g, (e, t) => t ? `\\${t}` : "(?:|/.*)")}$`));
}
__name(Ut, "Ut");
function Ls() {
  Ge = /* @__PURE__ */ Object.create(null);
}
__name(Ls, "Ls");
function Fs(s) {
  var l;
  const e = new Is(), t = [];
  if (s.length === 0) return Ms;
  const r = s.map((u) => [!/\*|\/:/.test(u[0]), ...u]).sort(([u, d], [g, y]) => u ? 1 : g ? -1 : d.length - y.length), o = /* @__PURE__ */ Object.create(null);
  for (let u = 0, d = -1, g = r.length; u < g; u++) {
    const [y, p, _] = r[u];
    y ? o[p] = [_.map(([w]) => [w, /* @__PURE__ */ Object.create(null)]), Ht] : d++;
    let b;
    try {
      b = e.insert(p, d, y);
    } catch (w) {
      throw w === Re ? new Bt(p) : w;
    }
    y || (t[d] = _.map(([w, S]) => {
      const T = /* @__PURE__ */ Object.create(null);
      for (S -= 1; S >= 0; S--) {
        const [v, f] = b[S];
        T[v] = f;
      }
      return [w, T];
    }));
  }
  const [n, a, c] = e.buildRegExp();
  for (let u = 0, d = t.length; u < d; u++) for (let g = 0, y = t[u].length; g < y; g++) {
    const p = (l = t[u][g]) == null ? void 0 : l[1];
    if (!p) continue;
    const _ = Object.keys(p);
    for (let b = 0, w = _.length; b < w; b++) p[_[b]] = c[p[_[b]]];
  }
  const i = [];
  for (const u in a) i[u] = t[a[u]];
  return [n, i, o];
}
__name(Fs, "Fs");
function Se(s, e) {
  if (s) {
    for (const t of Object.keys(s).sort((r, o) => o.length - r.length)) if (Ut(t).test(e)) return [...s[t]];
  }
}
__name(Se, "Se");
var oe;
var ae;
var Ze;
var qt;
var Tt;
var Ns = (Tt = class {
  static {
    __name(this, "Tt");
  }
  constructor() {
    C(this, Ze);
    E(this, "name", "RegExpRouter");
    C(this, oe);
    C(this, ae);
    E(this, "match", Os);
    x(this, oe, { [M]: /* @__PURE__ */ Object.create(null) }), x(this, ae, { [M]: /* @__PURE__ */ Object.create(null) });
  }
  add(s, e, t) {
    var c;
    const r = h(this, oe), o = h(this, ae);
    if (!r || !o) throw new Error(Nt);
    r[s] || [r, o].forEach((i) => {
      i[s] = /* @__PURE__ */ Object.create(null), Object.keys(i[M]).forEach((l) => {
        i[s][l] = [...i[M][l]];
      });
    }), e === "/*" && (e = "*");
    const n = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const i = Ut(e);
      s === M ? Object.keys(r).forEach((l) => {
        var u;
        (u = r[l])[e] || (u[e] = Se(r[l], e) || Se(r[M], e) || []);
      }) : (c = r[s])[e] || (c[e] = Se(r[s], e) || Se(r[M], e) || []), Object.keys(r).forEach((l) => {
        (s === M || s === l) && Object.keys(r[l]).forEach((u) => {
          i.test(u) && r[l][u].push([t, n]);
        });
      }), Object.keys(o).forEach((l) => {
        (s === M || s === l) && Object.keys(o[l]).forEach((u) => i.test(u) && o[l][u].push([t, n]));
      });
      return;
    }
    const a = Ot(e) || [e];
    for (let i = 0, l = a.length; i < l; i++) {
      const u = a[i];
      Object.keys(o).forEach((d) => {
        var g;
        (s === M || s === d) && ((g = o[d])[u] || (g[u] = [...Se(r[d], u) || Se(r[M], u) || []]), o[d][u].push([t, n - l + i + 1]));
      });
    }
  }
  buildAllMatchers() {
    const s = /* @__PURE__ */ Object.create(null);
    return Object.keys(h(this, ae)).concat(Object.keys(h(this, oe))).forEach((e) => {
      s[e] || (s[e] = O(this, Ze, qt).call(this, e));
    }), x(this, oe, x(this, ae, void 0)), Ls(), s;
  }
}, oe = /* @__PURE__ */ new WeakMap(), ae = /* @__PURE__ */ new WeakMap(), Ze = /* @__PURE__ */ new WeakSet(), qt = /* @__PURE__ */ __name(function(s) {
  const e = [];
  let t = s === M;
  return [h(this, oe), h(this, ae)].forEach((r) => {
    const o = r[s] ? Object.keys(r[s]).map((n) => [n, r[s][n]]) : [];
    o.length !== 0 ? (t || (t = true), e.push(...o)) : s !== M && e.push(...Object.keys(r[M]).map((n) => [n, r[M][n]]));
  }), t ? Fs(e) : null;
}, "qt"), Tt);
var ie;
var ee;
var Rt;
var Bs = (Rt = class {
  static {
    __name(this, "Rt");
  }
  constructor(s) {
    E(this, "name", "SmartRouter");
    C(this, ie, []);
    C(this, ee, []);
    x(this, ie, s.routers);
  }
  add(s, e, t) {
    if (!h(this, ee)) throw new Error(Nt);
    h(this, ee).push([s, e, t]);
  }
  match(s, e) {
    if (!h(this, ee)) throw new Error("Fatal error");
    const t = h(this, ie), r = h(this, ee), o = t.length;
    let n = 0, a;
    for (; n < o; n++) {
      const c = t[n];
      try {
        for (let i = 0, l = r.length; i < l; i++) c.add(...r[i]);
        a = c.match(s, e);
      } catch (i) {
        if (i instanceof Bt) continue;
        throw i;
      }
      this.match = c.match.bind(c), x(this, ie, [c]), x(this, ee, void 0);
      break;
    }
    if (n === o) throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, a;
  }
  get activeRouter() {
    if (h(this, ee) || h(this, ie).length !== 1) throw new Error("No active router has been determined yet.");
    return h(this, ie)[0];
  }
}, ie = /* @__PURE__ */ new WeakMap(), ee = /* @__PURE__ */ new WeakMap(), Rt);
var je = /* @__PURE__ */ Object.create(null);
var ce;
var k;
var _e;
var Oe;
var N;
var te;
var de;
var xt;
var Wt = (xt = class {
  static {
    __name(this, "xt");
  }
  constructor(s, e, t) {
    C(this, te);
    C(this, ce);
    C(this, k);
    C(this, _e);
    C(this, Oe, 0);
    C(this, N, je);
    if (x(this, k, t || /* @__PURE__ */ Object.create(null)), x(this, ce, []), s && e) {
      const r = /* @__PURE__ */ Object.create(null);
      r[s] = { handler: e, possibleKeys: [], score: 0 }, x(this, ce, [r]);
    }
    x(this, _e, []);
  }
  insert(s, e, t) {
    x(this, Oe, ++ht(this, Oe)._);
    let r = this;
    const o = ms(e), n = [];
    for (let a = 0, c = o.length; a < c; a++) {
      const i = o[a], l = o[a + 1], u = fs(i, l), d = Array.isArray(u) ? u[0] : i;
      if (d in h(r, k)) {
        r = h(r, k)[d], u && n.push(u[1]);
        continue;
      }
      h(r, k)[d] = new Wt(), u && (h(r, _e).push(u), n.push(u[1])), r = h(r, k)[d];
    }
    return h(r, ce).push({ [s]: { handler: t, possibleKeys: n.filter((a, c, i) => i.indexOf(a) === c), score: h(this, Oe) } }), r;
  }
  search(s, e) {
    var c;
    const t = [];
    x(this, N, je);
    let o = [this];
    const n = Dt(e), a = [];
    for (let i = 0, l = n.length; i < l; i++) {
      const u = n[i], d = i === l - 1, g = [];
      for (let y = 0, p = o.length; y < p; y++) {
        const _ = o[y], b = h(_, k)[u];
        b && (x(b, N, h(_, N)), d ? (h(b, k)["*"] && t.push(...O(this, te, de).call(this, h(b, k)["*"], s, h(_, N))), t.push(...O(this, te, de).call(this, b, s, h(_, N)))) : g.push(b));
        for (let w = 0, S = h(_, _e).length; w < S; w++) {
          const T = h(_, _e)[w], v = h(_, N) === je ? {} : { ...h(_, N) };
          if (T === "*") {
            const P = h(_, k)["*"];
            P && (t.push(...O(this, te, de).call(this, P, s, h(_, N))), x(P, N, v), g.push(P));
            continue;
          }
          const [f, R, A] = T;
          if (!u && !(A instanceof RegExp)) continue;
          const D = h(_, k)[f], j = n.slice(i).join("/");
          if (A instanceof RegExp) {
            const P = A.exec(j);
            if (P) {
              if (v[R] = P[0], t.push(...O(this, te, de).call(this, D, s, h(_, N), v)), Object.keys(h(D, k)).length) {
                x(D, N, v);
                const $ = ((c = P[0].match(/\//)) == null ? void 0 : c.length) ?? 0;
                (a[$] || (a[$] = [])).push(D);
              }
              continue;
            }
          }
          (A === true || A.test(u)) && (v[R] = u, d ? (t.push(...O(this, te, de).call(this, D, s, v, h(_, N))), h(D, k)["*"] && t.push(...O(this, te, de).call(this, h(D, k)["*"], s, v, h(_, N)))) : (x(D, N, v), g.push(D)));
        }
      }
      o = g.concat(a.shift() ?? []);
    }
    return t.length > 1 && t.sort((i, l) => i.score - l.score), [t.map(({ handler: i, params: l }) => [i, l])];
  }
}, ce = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new WeakMap(), _e = /* @__PURE__ */ new WeakMap(), Oe = /* @__PURE__ */ new WeakMap(), N = /* @__PURE__ */ new WeakMap(), te = /* @__PURE__ */ new WeakSet(), de = /* @__PURE__ */ __name(function(s, e, t, r) {
  const o = [];
  for (let n = 0, a = h(s, ce).length; n < a; n++) {
    const c = h(s, ce)[n], i = c[e] || c[M], l = {};
    if (i !== void 0 && (i.params = /* @__PURE__ */ Object.create(null), o.push(i), t !== je || r && r !== je)) for (let u = 0, d = i.possibleKeys.length; u < d; u++) {
      const g = i.possibleKeys[u], y = l[i.score];
      i.params[g] = r != null && r[g] && !y ? r[g] : t[g] ?? (r == null ? void 0 : r[g]), l[i.score] = true;
    }
  }
  return o;
}, "de"), xt);
var ye;
var Ct;
var $s = (Ct = class {
  static {
    __name(this, "Ct");
  }
  constructor() {
    E(this, "name", "TrieRouter");
    C(this, ye);
    x(this, ye, new Wt());
  }
  add(s, e, t) {
    const r = Ot(e);
    if (r) {
      for (let o = 0, n = r.length; o < n; o++) h(this, ye).insert(s, r[o], t);
      return;
    }
    h(this, ye).insert(s, e, t);
  }
  match(s, e) {
    return h(this, ye).search(s, e);
  }
}, ye = /* @__PURE__ */ new WeakMap(), Ct);
var Vt = class extends $t {
  static {
    __name(this, "Vt");
  }
  constructor(s = {}) {
    super(s), this.router = s.router ?? new Bs({ routers: [new Ns(), new $s()] });
  }
};
var ks = /* @__PURE__ */ __name((s) => {
  const t = { ...{ origin: "*", allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"], allowHeaders: [], exposeHeaders: [] }, ...s }, r = /* @__PURE__ */ ((n) => typeof n == "string" ? n === "*" ? () => n : (a) => n === a ? a : null : typeof n == "function" ? n : (a) => n.includes(a) ? a : null)(t.origin), o = ((n) => typeof n == "function" ? n : Array.isArray(n) ? () => n : () => [])(t.allowMethods);
  return async function(a, c) {
    var u;
    function i(d, g) {
      a.res.headers.set(d, g);
    }
    __name(i, "i");
    const l = await r(a.req.header("origin") || "", a);
    if (l && i("Access-Control-Allow-Origin", l), t.credentials && i("Access-Control-Allow-Credentials", "true"), (u = t.exposeHeaders) != null && u.length && i("Access-Control-Expose-Headers", t.exposeHeaders.join(",")), a.req.method === "OPTIONS") {
      t.origin !== "*" && i("Vary", "Origin"), t.maxAge != null && i("Access-Control-Max-Age", t.maxAge.toString());
      const d = await o(a.req.header("origin") || "", a);
      d.length && i("Access-Control-Allow-Methods", d.join(","));
      let g = t.allowHeaders;
      if (!(g != null && g.length)) {
        const y = a.req.header("Access-Control-Request-Headers");
        y && (g = y.split(/\s*,\s*/));
      }
      return g != null && g.length && (i("Access-Control-Allow-Headers", g.join(",")), a.res.headers.append("Vary", "Access-Control-Request-Headers")), a.res.headers.delete("Content-Length"), a.res.headers.delete("Content-Type"), new Response(null, { headers: a.res.headers, status: 204, statusText: "No Content" });
    }
    await c(), t.origin !== "*" && a.header("Vary", "Origin", { append: true });
  };
}, "ks");
var Hs = /^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;
var yt = /* @__PURE__ */ __name((s, e = qs) => {
  const t = /\.([a-zA-Z0-9]+?)$/, r = s.match(t);
  if (!r) return;
  let o = e[r[1]];
  return o && o.startsWith("text") && (o += "; charset=utf-8"), o;
}, "yt");
var Us = { aac: "audio/aac", avi: "video/x-msvideo", avif: "image/avif", av1: "video/av1", bin: "application/octet-stream", bmp: "image/bmp", css: "text/css", csv: "text/csv", eot: "application/vnd.ms-fontobject", epub: "application/epub+zip", gif: "image/gif", gz: "application/gzip", htm: "text/html", html: "text/html", ico: "image/x-icon", ics: "text/calendar", jpeg: "image/jpeg", jpg: "image/jpeg", js: "text/javascript", json: "application/json", jsonld: "application/ld+json", map: "application/json", mid: "audio/x-midi", midi: "audio/x-midi", mjs: "text/javascript", mp3: "audio/mpeg", mp4: "video/mp4", mpeg: "video/mpeg", oga: "audio/ogg", ogv: "video/ogg", ogx: "application/ogg", opus: "audio/opus", otf: "font/otf", pdf: "application/pdf", png: "image/png", rtf: "application/rtf", svg: "image/svg+xml", tif: "image/tiff", tiff: "image/tiff", ts: "video/mp2t", ttf: "font/ttf", txt: "text/plain", wasm: "application/wasm", webm: "video/webm", weba: "audio/webm", webmanifest: "application/manifest+json", webp: "image/webp", woff: "font/woff", woff2: "font/woff2", xhtml: "application/xhtml+xml", xml: "application/xml", zip: "application/zip", "3gp": "video/3gpp", "3g2": "video/3gpp2", gltf: "model/gltf+json", glb: "model/gltf-binary" };
var qs = Us;
var Ws = /* @__PURE__ */ __name((...s) => {
  let e = s.filter((o) => o !== "").join("/");
  e = e.replace(new RegExp("(?<=\\/)\\/+", "g"), "");
  const t = e.split("/"), r = [];
  for (const o of t) o === ".." && r.length > 0 && r.at(-1) !== ".." ? r.pop() : o !== "." && r.push(o);
  return r.join("/") || ".";
}, "Ws");
var Kt = { br: ".br", zstd: ".zst", gzip: ".gz" };
var Vs = Object.keys(Kt);
var Ks = "index.html";
var Gs = /* @__PURE__ */ __name((s) => {
  const e = s.root ?? "./", t = s.path, r = s.join ?? Ws;
  return async (o, n) => {
    var u, d, g, y;
    if (o.finalized) return n();
    let a;
    if (s.path) a = s.path;
    else try {
      if (a = decodeURIComponent(o.req.path), /(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(a)) throw new Error();
    } catch {
      return await ((u = s.onNotFound) == null ? void 0 : u.call(s, o.req.path, o)), n();
    }
    let c = r(e, !t && s.rewriteRequestPath ? s.rewriteRequestPath(a) : a);
    s.isDir && await s.isDir(c) && (c = r(c, Ks));
    const i = s.getContent;
    let l = await i(c, o);
    if (l instanceof Response) return o.newResponse(l.body, l);
    if (l) {
      const p = s.mimes && yt(c, s.mimes) || yt(c);
      if (o.header("Content-Type", p || "application/octet-stream"), s.precompressed && (!p || Hs.test(p))) {
        const _ = new Set((d = o.req.header("Accept-Encoding")) == null ? void 0 : d.split(",").map((b) => b.trim()));
        for (const b of Vs) {
          if (!_.has(b)) continue;
          const w = await i(c + Kt[b], o);
          if (w) {
            l = w, o.header("Content-Encoding", b), o.header("Vary", "Accept-Encoding", { append: true });
            break;
          }
        }
      }
      return await ((g = s.onFound) == null ? void 0 : g.call(s, c, o)), o.body(l);
    }
    await ((y = s.onNotFound) == null ? void 0 : y.call(s, c, o)), await n();
  };
}, "Gs");
var Ys = /* @__PURE__ */ __name(async (s, e) => {
  let t;
  e && e.manifest ? typeof e.manifest == "string" ? t = JSON.parse(e.manifest) : t = e.manifest : typeof __STATIC_CONTENT_MANIFEST == "string" ? t = JSON.parse(__STATIC_CONTENT_MANIFEST) : t = __STATIC_CONTENT_MANIFEST;
  let r;
  e && e.namespace ? r = e.namespace : r = __STATIC_CONTENT;
  const o = t[s] || s;
  if (!o) return null;
  const n = await r.get(o, { type: "stream" });
  return n || null;
}, "Ys");
var Xs = /* @__PURE__ */ __name((s) => async function(t, r) {
  return Gs({ ...s, getContent: /* @__PURE__ */ __name(async (n) => Ys(n, { manifest: s.manifest, namespace: s.namespace ? s.namespace : t.env ? t.env.__STATIC_CONTENT : void 0 }), "getContent") })(t, r);
}, "Xs");
var Gt = /* @__PURE__ */ __name((s) => Xs(s), "Gt");
var it = 480 * 60 * 1e3;
function fe() {
  const e = (/* @__PURE__ */ new Date()).getTime();
  return new Date(e + it);
}
__name(fe, "fe");
function J(s) {
  const e = s || fe(), t = e.getUTCFullYear(), r = String(e.getUTCMonth() + 1).padStart(2, "0"), o = String(e.getUTCDate()).padStart(2, "0");
  return `${t}-${r}-${o}`;
}
__name(J, "J");
function ge() {
  const s = fe();
  return s.setUTCHours(0, 0, 0, 0), new Date(s.getTime() - it).toISOString();
}
__name(ge, "ge");
function ct() {
  const s = fe();
  return s.setUTCDate(s.getUTCDate() - 1), J(s);
}
__name(ct, "ct");
function Yt(s) {
  const e = s || fe(), t = e.getUTCFullYear(), r = String(e.getUTCMonth() + 1).padStart(2, "0"), o = String(e.getUTCDate()).padStart(2, "0"), n = String(e.getUTCHours()).padStart(2, "0"), a = String(e.getUTCMinutes()).padStart(2, "0"), c = String(e.getUTCSeconds()).padStart(2, "0");
  return `${t}-${r}-${o} ${n}:${a}:${c}`;
}
__name(Yt, "Yt");
function Xt() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(Xt, "Xt");
function lt(s) {
  const e = s.includes("T") ? s : s.replace(" ", "T") + "Z", t = new Date(e), r = new Date(t.getTime() + it);
  return J(r);
}
__name(lt, "lt");
function Ye(s) {
  const e = fe();
  return e.setUTCDate(e.getUTCDate() - s), J(e);
}
__name(Ye, "Ye");
function zs() {
  const s = /* @__PURE__ */ new Date();
  fe(), console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551         \u65F6\u95F4\u8C03\u8BD5\u4FE1\u606F                    \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
  UTC\u65F6\u95F4:    ${s.toISOString()}
  UTC\u65E5\u671F:    ${s.toISOString().split("T")[0]}
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  \u5317\u4EAC\u65F6\u95F4:   ${Yt()}
  \u5317\u4EAC\u65E5\u671F:   ${J()}
  \u4ECA\u59290\u70B9:    ${ge()}
  \u6628\u5929\u65E5\u671F:   ${ct()}
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
  `);
}
__name(zs, "zs");
var Js = Object.freeze(Object.defineProperty({ __proto__: null, convertUTCtoBeijingDateString: lt, debugTimeInfo: zs, getBeijingDateDaysAgo: Ye, getBeijingDateString: J, getBeijingDateTimeString: Yt, getBeijingISOString: Xt, getBeijingTime: fe, getBeijingTodayStart: ge, getBeijingYesterday: ct }, Symbol.toStringTag, { value: "Module" }));
var Xe = { BTC: "bitcoin", ETH: "ethereum", XRP: "ripple", BNB: "binancecoin", SOL: "solana", LTC: "litecoin", DOGE: "dogecoin", SUI: "sui", TRX: "tron", TON: "the-open-network", ETC: "ethereum-classic", BCH: "bitcoin-cash", HBAR: "hedera-hashgraph", XLM: "stellar", FIL: "filecoin", ADA: "cardano", LINK: "chainlink", CRO: "crypto-com-chain", DOT: "polkadot", OKB: "okb", AAVE: "aave", UNI: "uniswap", NEAR: "near", APT: "aptos", CFX: "conflux-token", CRV: "curve-dao-token", STX: "blockstack", LDO: "lido-dao", TAO: "bittensor" };
var H = class {
  static {
    __name(this, "H");
  }
  constructor(e) {
    E(this, "db");
    this.db = e;
  }
  async getAllCoins() {
    return (await this.db.prepare("SELECT * FROM coins ORDER BY rank_order").all()).results;
  }
  async fetchPricesFromCoinGecko() {
    const r = `https://api.coingecko.com/api/v3/simple/price?ids=${(await this.getAllCoins()).map((a) => Xe[a.symbol]).join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`, o = 3;
    let n = null;
    for (let a = 0; a <= o; a++) try {
      if (a > 0) {
        const i = Math.min(1e3 * Math.pow(2, a - 1), 1e4);
        console.log(`CoinGecko API \u91CD\u8BD5 ${a}/${o}\uFF0C\u7B49\u5F85 ${i}ms...`), await new Promise((l) => setTimeout(l, i));
      }
      const c = await fetch(r, { headers: { Accept: "application/json" } });
      if (c.status === 429) {
        console.warn(`CoinGecko API \u9650\u6D41 (429)\uFF0C\u5C1D\u8BD5 ${a + 1}/${o + 1}`), n = new Error(`CoinGecko API \u9650\u6D41: ${c.status}`);
        continue;
      }
      if (!c.ok) throw new Error(`CoinGecko API error: ${c.status}`);
      return await c.json();
    } catch (c) {
      if (console.error(`CoinGecko API \u8BF7\u6C42\u5931\u8D25 (\u5C1D\u8BD5 ${a + 1}/${o + 1}):`, c.message), n = c, a === o) throw c;
    }
    console.error("CoinGecko API \u6240\u6709\u91CD\u8BD5\u5747\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4F7F\u7528\u5907\u4EFD\u6570\u636E\u6E90...");
    try {
      return await this.fetchPricesFromBinance();
    } catch (a) {
      console.error("Binance \u5907\u4EFD\u6570\u636E\u6E90\u5931\u8D25:", a.message);
    }
    try {
      return console.log("\u5C1D\u8BD5 CryptoCompare API \u4F5C\u4E3A\u7B2C\u4E09\u5907\u4EFD\u6570\u636E\u6E90..."), await this.fetchPricesFromCoinCap();
    } catch (a) {
      console.error("CryptoCompare \u5907\u4EFD\u6570\u636E\u6E90\u4E5F\u5931\u8D25:", a.message);
    }
    throw n || new Error("\u6240\u6709\u6570\u636E\u6E90\u5747\u8BF7\u6C42\u5931\u8D25\uFF08CoinGecko + Binance + CryptoCompare\uFF09");
  }
  async fetchPricesFromCoinCap() {
    var o;
    const e = await this.getAllCoins(), t = {};
    console.log("\u4F7F\u7528 CryptoCompare API \u4F5C\u4E3A\u7B2C\u4E09\u5907\u4EFD\u6570\u636E\u6E90...");
    const r = e.map((n) => n.symbol).join(",");
    try {
      const n = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${r}&tsyms=USD`, a = await fetch(n, { headers: { Accept: "application/json" } });
      if (!a.ok) throw new Error(`CryptoCompare API error: ${a.status}`);
      const c = await a.json();
      if (!c.RAW) throw new Error("CryptoCompare API \u8FD4\u56DE\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
      for (const l of e) {
        const u = l.symbol, d = (o = c.RAW[u]) == null ? void 0 : o.USD;
        if (d) {
          const g = Xe[u];
          t[g] = { usd: d.PRICE, usd_24h_change: d.CHANGEPCT24HOUR, usd_market_cap: d.MKTCAP, usd_24h_vol: d.VOLUME24HOURTO };
        } else console.warn(`CryptoCompare: \u672A\u627E\u5230 ${u} \u7684\u6570\u636E`);
      }
      const i = Object.keys(t).length;
      if (i < e.length / 2) throw new Error(`CryptoCompare API \u6570\u636E\u4E0D\u8DB3: \u4EC5\u83B7\u53D6\u5230 ${i}/${e.length} \u4E2A\u5E01\u79CD`);
      return console.log(`\u2705 CryptoCompare API \u6210\u529F\u83B7\u53D6 ${i}/${e.length} \u4E2A\u5E01\u79CD\u7684\u6570\u636E`), t;
    } catch (n) {
      throw console.error("CryptoCompare API \u8BF7\u6C42\u5931\u8D25:", n.message), n;
    }
  }
  async fetchPricesFromBinance() {
    const e = await this.getAllCoins(), t = {};
    console.log("\u4F7F\u7528 Binance API \u4F5C\u4E3A\u5907\u4EFD\u6570\u636E\u6E90...");
    for (const o of e) {
      const n = o.symbol, a = `${n}USDT`;
      try {
        const c = `https://api.binance.com/api/v3/ticker/24hr?symbol=${a}`, i = await fetch(c);
        if (i.ok) {
          const l = await i.json(), u = Xe[n];
          t[u] = { usd: parseFloat(l.lastPrice), usd_24h_change: parseFloat(l.priceChangePercent), usd_market_cap: 0, usd_24h_vol: parseFloat(l.quoteVolume) };
        } else console.warn(`Binance API \u83B7\u53D6 ${n} \u5931\u8D25: ${i.status}`);
        await new Promise((l) => setTimeout(l, 100));
      } catch (c) {
        console.warn(`Binance API \u8BF7\u6C42 ${n} \u5F02\u5E38:`, c.message);
      }
    }
    const r = Object.keys(t).length;
    if (r < e.length / 2) throw new Error(`Binance API \u6570\u636E\u4E0D\u8DB3: \u4EC5\u83B7\u53D6\u5230 ${r}/${e.length} \u4E2A\u5E01\u79CD`);
    return console.log(`\u2705 Binance API \u6210\u529F\u83B7\u53D6 ${r}/${e.length} \u4E2A\u5E01\u79CD\u7684\u6570\u636E`), t;
  }
  async savePriceRecord(e, t) {
    await this.db.prepare(`
        INSERT INTO price_records (symbol, price, change_24h, market_cap, volume_24h)
        VALUES (?, ?, ?, ?, ?)
      `).bind(e, t.usd, t.usd_24h_change || null, t.usd_market_cap || null, t.usd_24h_vol || null).run();
  }
  async getPreviousPriceRecord(e) {
    return await this.db.prepare(`
        SELECT * FROM price_records 
        WHERE symbol = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `).bind(e).first();
  }
  async getPreviousRoundDetail(e) {
    return await this.db.prepare(`
        SELECT * FROM coin_round_details 
        WHERE symbol = ? 
        ORDER BY round_time DESC 
        LIMIT 1 OFFSET 1
      `).bind(e).first();
  }
  async getOrCreatePriceExtreme(e, t) {
    let r = await this.db.prepare("SELECT * FROM price_extremes WHERE symbol = ?").bind(e).first();
    return r || (await this.db.prepare(`
          INSERT INTO price_extremes (symbol, all_time_high, all_time_low, ath_date, atl_date)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).bind(e, t, t).run(), r = await this.db.prepare("SELECT * FROM price_extremes WHERE symbol = ?").bind(e).first()), r;
  }
  async updatePriceExtreme(e, t, r) {
    t === "high" ? await this.db.prepare(`
          UPDATE price_extremes 
          SET all_time_high = ?, ath_date = datetime('now'), last_updated = datetime('now'), high_count = 0
          WHERE symbol = ?
        `).bind(r, e).run() : await this.db.prepare(`
          UPDATE price_extremes 
          SET all_time_low = ?, atl_date = datetime('now'), last_updated = datetime('now'), low_count = 0
          WHERE symbol = ?
        `).bind(r, e).run();
  }
  async incrementExtremeCount(e, t) {
    t === "high" ? await this.db.prepare(`
          UPDATE price_extremes 
          SET high_count = high_count + 1, last_updated = datetime('now')
          WHERE symbol = ?
        `).bind(e).run() : await this.db.prepare(`
          UPDATE price_extremes 
          SET low_count = low_count + 1, last_updated = datetime('now')
          WHERE symbol = ?
        `).bind(e).run();
  }
  async saveExtremeRecord(e, t, r, o, n) {
    await this.db.prepare(`
        INSERT INTO extreme_records (symbol, record_type, price, prev_extreme, zero_count)
        VALUES (?, ?, ?, ?, ?)
      `).bind(e, t, r, o, n).run();
  }
  async shouldResetDailyExtremes() {
    const e = await this.db.prepare(`
        SELECT last_updated 
        FROM price_extremes 
        ORDER BY last_updated DESC 
        LIMIT 1
      `).first();
    if (!e || !e.last_updated) return false;
    const t = lt(e.last_updated), r = J();
    return console.log(`\u{1F4C5} \u68C0\u67E5\u662F\u5426\u9700\u8981\u91CD\u7F6E: \u4E0A\u6B21\u66F4\u65B0=${t}, \u4ECA\u5929=${r}`), t !== r;
  }
  async resetDailyExtremes() {
    await this.db.prepare(`
        UPDATE price_extremes 
        SET high_count = 0, 
            low_count = 0, 
            extreme_up_count = 0, 
            extreme_down_count = 0,
            last_updated = datetime('now')
      `).run(), console.log("\u2705 \u5DF2\u91CD\u7F6E\u6BCF\u65E5\u6781\u503C\u6570\u636E\uFF08\u9694\u5929\u7B2C\u4E00\u6B21\u5237\u65B0\uFF09");
  }
  async resetAllDailyData() {
    const e = J(), t = ct();
    console.log("\u{1F504} \u5F00\u59CB\u6267\u884C\u6BCF\u65E5\u6570\u636E\u6E05\u96F6\uFF08\u5317\u4EAC\u65F6\u95F4\uFF09..."), console.log(`   \u{1F4C5} \u4ECA\u5929: ${e}`), console.log(`   \u{1F4C5} \u6628\u5929: ${t}`), await this.db.prepare(`
        UPDATE price_extremes 
        SET high_count = 0, 
            low_count = 0, 
            extreme_up_count = 0, 
            extreme_down_count = 0,
            last_updated = datetime('now')
      `).run(), console.log("  \u2705 \u5DF2\u6E05\u96F6 price_extremes \u8BA1\u6570\u5668\uFF08\u521B\u65B0\u9AD8/\u4F4E\u8BA1\u6B21\uFF09"), await this.db.prepare("DELETE FROM daily_stats WHERE date = ?").bind(e).run(), console.log(`  \u2705 \u5DF2\u6E05\u7406\u4ECA\u5929\u7684 daily_stats \u6570\u636E\uFF08${e}\uFF09\uFF0C\u91CD\u65B0\u5F00\u59CB\u7D2F\u8BA1`), console.log("  \u2139\uFE0F  round_stats \u8868\u6C38\u4E45\u4FDD\u7559\uFF0C\u6BCF\u8F6E\u7EDF\u8BA1\u5B9E\u65F6\u8BA1\u7B97\u975E\u7D2F\u8BA1\u503C"), console.log("  \u2139\uFE0F  coin_round_details \u8868\u6C38\u4E45\u4FDD\u7559\uFF0C\u53EF\u56DE\u770B\u4EFB\u610F\u5386\u53F2\u65F6\u523B"), console.log("  \u2139\uFE0F  trading_signals \u548C alert_signals \u8868\u6C38\u4E45\u4FDD\u7559"), console.log("\u2705 \u6BCF\u65E5\u6570\u636E\u6E05\u96F6\u5B8C\u6210\uFF01\u8BA1\u6570\u5668\u5DF2\u6E05\u96F6\uFF0C\u6240\u6709\u5386\u53F2\u6570\u636E\u5B8C\u6574\u4FDD\u7559\uFF08\u5317\u4EAC\u65F6\u95F4\uFF09");
  }
  async incrementExtremeUpCount(e) {
    await this.db.prepare(`
        UPDATE price_extremes 
        SET extreme_up_count = extreme_up_count + 1, last_updated = datetime('now')
        WHERE symbol = ?
      `).bind(e).run();
  }
  async incrementExtremeDownCount(e) {
    await this.db.prepare(`
        UPDATE price_extremes 
        SET extreme_down_count = extreme_down_count + 1, last_updated = datetime('now')
        WHERE symbol = ?
      `).bind(e).run();
  }
  async resetExtremeUpCount(e) {
    await this.db.prepare(`
        UPDATE price_extremes 
        SET extreme_up_count = 0, last_updated = datetime('now')
        WHERE symbol = ?
      `).bind(e).run();
  }
  async resetExtremeDownCount(e) {
    await this.db.prepare(`
        UPDATE price_extremes 
        SET extreme_down_count = 0, last_updated = datetime('now')
        WHERE symbol = ?
      `).bind(e).run();
  }
  async saveRoundStat(e, t) {
    await this.db.prepare(`
        INSERT INTO round_stats (
          round_time, green_count, red_count, green_ratio,
          extreme_up_count, extreme_down_count, surge_count, crash_count, risk_alert_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(e, t.green_count, t.red_count, t.green_ratio, t.extreme_up_count, t.extreme_down_count, t.surge_count, t.crash_count, t.risk_alert_count).run();
  }
  async saveCoinRoundDetail(e, t, r) {
    await this.db.prepare(`
        INSERT INTO coin_round_details (
          symbol, round_time, price, prev_price, change_amount, change_percent,
          is_green, is_extreme_up, is_extreme_down, is_surge, is_crash, rank_in_round, change_24h,
          previous_round_time, change_vs_prev_round, is_surge_vs_prev, is_crash_vs_prev
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(e, t, r.price, r.prev_price, r.change_amount, r.change_percent, r.is_green ? 1 : 0, r.is_extreme_up ? 1 : 0, r.is_extreme_down ? 1 : 0, r.is_surge ? 1 : 0, r.is_crash ? 1 : 0, r.rank_in_round, r.change_24h || 0, r.previous_round_time || null, r.change_vs_prev_round || 0, r.is_surge_vs_prev || 0, r.is_crash_vs_prev || 0).run();
  }
  async updateDailyStat(e, t, r) {
    const o = await this.db.prepare("SELECT * FROM daily_stats WHERE date = ? AND symbol = ?").bind(e, t).first();
    if (o) {
      const n = { total_surges: r.total_surges !== void 0 ? r.total_surges : o.total_surges, total_crashes: r.total_crashes !== void 0 ? r.total_crashes : o.total_crashes, new_high_count: r.new_high_count !== void 0 ? r.new_high_count : o.new_high_count, new_low_count: r.new_low_count !== void 0 ? r.new_low_count : o.new_low_count, market_trend: r.market_trend !== void 0 ? r.market_trend : o.market_trend, trend_strength: r.trend_strength !== void 0 ? r.trend_strength : o.trend_strength, star_rating: r.star_rating !== void 0 ? r.star_rating : o.star_rating, star_type: r.star_type !== void 0 ? r.star_type : o.star_type };
      await this.db.prepare(`
          UPDATE daily_stats 
          SET total_surges = ?, total_crashes = ?, new_high_count = ?, new_low_count = ?,
              market_trend = ?, trend_strength = ?, star_rating = ?, star_type = ?
          WHERE date = ? AND symbol = ?
        `).bind(n.total_surges, n.total_crashes, n.new_high_count, n.new_low_count, n.market_trend, n.trend_strength, n.star_rating, n.star_type, e, t).run();
    } else await this.db.prepare(`
          INSERT INTO daily_stats (
            date, symbol, total_surges, total_crashes, new_high_count, new_low_count,
            market_trend, trend_strength, star_rating, star_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(e, t, r.total_surges || 0, r.total_crashes || 0, r.new_high_count || 0, r.new_low_count || 0, r.market_trend || "neutral", r.trend_strength || 0, r.star_rating || 0, r.star_type || "none").run();
  }
  async getTodayStats(e) {
    return (await this.db.prepare("SELECT * FROM daily_stats WHERE date = ?").bind(e).all()).results;
  }
  async getRoundStatsByDate(e) {
    const t = /* @__PURE__ */ new Date(`${e}T00:00:00+08:00`), r = new Date(t.getTime()).toISOString(), o = new Date(t.getTime() + 1440 * 60 * 1e3 - 1).toISOString();
    return (await this.db.prepare(`
        SELECT * FROM round_stats 
        WHERE round_time >= ? AND round_time <= ?
        ORDER BY round_time DESC
      `).bind(r, o).all()).results;
  }
  async updateRoundRiskAlert(e, t) {
    await this.db.prepare(`
        UPDATE round_stats 
        SET risk_alert_count = ?
        WHERE round_time = ?
      `).bind(t, e).run();
  }
  async updateCoinPriority(e, t, r, o) {
    await this.db.prepare(`
        INSERT INTO coin_priority (symbol, level, low_ratio, high_ratio)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          level = excluded.level,
          low_ratio = excluded.low_ratio,
          high_ratio = excluded.high_ratio,
          last_updated = datetime('now')
      `).bind(e, t, r, o).run();
  }
  async getLatestRoundStats(e = 10) {
    return (await this.db.prepare("SELECT * FROM round_stats ORDER BY round_time DESC LIMIT ?").bind(e).all()).results;
  }
  async getLatestCoinDetails(e) {
    return (await this.db.prepare("SELECT * FROM coin_round_details WHERE round_time = ? ORDER BY rank_in_round").bind(e).all()).results;
  }
  async getAllPriceExtremes() {
    return (await this.db.prepare("SELECT * FROM price_extremes").all()).results;
  }
  async getLatestExtremeRecords(e = 100) {
    return (await this.db.prepare(`
        SELECT 
          symbol,
          record_type,
          price,
          timestamp
        FROM extreme_records
        ORDER BY timestamp DESC
        LIMIT ?
      `).bind(e).all()).results;
  }
  async getAllCoinPriorities() {
    return (await this.db.prepare("SELECT * FROM coin_priority ORDER BY level").all()).results;
  }
  async getRoundStatByTime(e) {
    return await this.db.prepare("SELECT * FROM round_stats WHERE round_time = ?").bind(e).first();
  }
  async getTodayExtremeCount(e, t) {
    const r = t === "high" ? "new_high" : "new_low", o = await this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM extreme_records 
        WHERE DATE(timestamp) = ? AND record_type = ?
      `).bind(e, r).first();
    return (o == null ? void 0 : o.count) || 0;
  }
  async getTodayV1Counts(e) {
    const t = await this.db.prepare(`
        SELECT 
          symbol,
          COUNT(DISTINCT signal_time) as v1_count
        FROM trading_signals
        WHERE DATE(created_at) = ?
          AND (details LIKE '%V1%' OR details LIKE '%V1+%')
        GROUP BY symbol
      `).bind(e).all(), r = {};
    return (t.results || []).forEach((o) => {
      r[o.symbol] = o.v1_count;
    }), r;
  }
  async getTimeRangeStats() {
    const e = await this.getAllCoins(), t = /* @__PURE__ */ new Date(), r = 480 * 60 * 1e3, o = new Date(t.getTime() + r), n = new Date(o.getFullYear(), o.getMonth(), o.getDate()), a = new Date(n.getTime() - r), c = new Date(a.getTime() - 4320 * 60 * 1e3), i = new Date(a.getTime() - 10080 * 60 * 1e3), l = a.toISOString(), u = c.toISOString(), d = i.toISOString();
    return await Promise.all(e.map(async (y) => {
      const p = await this.db.prepare(`
            SELECT COUNT(*) as count
            FROM extreme_records
            WHERE symbol = ? AND timestamp >= ?
          `).bind(y.symbol, l).first(), _ = await this.db.prepare(`
            SELECT COUNT(*) as count
            FROM extreme_records
            WHERE symbol = ? AND timestamp >= ?
          `).bind(y.symbol, u).first(), b = await this.db.prepare(`
            SELECT COUNT(*) as count
            FROM extreme_records
            WHERE symbol = ? AND timestamp >= ?
          `).bind(y.symbol, d).first();
      return { symbol: y.symbol, today: (p == null ? void 0 : p.count) || 0, three_days: (_ == null ? void 0 : _.count) || 0, seven_days: (b == null ? void 0 : b.count) || 0 };
    }));
  }
};
function Zs(s) {
  const e = Object.entries(Xe).find(([t, r]) => r === s);
  return e ? e[0] : null;
}
__name(Zs, "Zs");
var He = class {
  static {
    __name(this, "He");
  }
  constructor(e, t) {
    E(this, "botToken");
    E(this, "chatId");
    E(this, "apiUrl");
    this.botToken = e, this.chatId = t, this.apiUrl = `https://api.telegram.org/bot${e}`;
  }
  async sendAlert(e, t) {
    try {
      const r = this.buildAlertMessage(e, t), n = await (await fetch(`${this.apiUrl}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: this.chatId, text: r, parse_mode: "HTML" }) })).json();
      return n.ok ? (console.log(`\u2705 \u9884\u8B66\u5DF2\u53D1\u9001\u5230Telegram: ${e.symbol} ${e.time}`), true) : (console.error("\u274C Telegram\u53D1\u9001\u5931\u8D25:", JSON.stringify(n)), console.error("   \u6D88\u606F\u5185\u5BB9\u9884\u89C8:", r.substring(0, 200)), false);
    } catch (r) {
      return console.error("\u274C Telegram\u53D1\u9001\u5F02\u5E38:", r), false;
    }
  }
  buildAlertMessage(e, t) {
    var l, u, d, g, y;
    const r = t.high && t.low && t.low > 0 ? ((t.high - t.low) / t.low * 100).toFixed(2) : "0.00", o = t.sar && t.close ? (t.close - t.sar).toFixed(2) : "0.00", n = t.rsi_5min && t.rsi_5min > 80 ? "\u2705" : "\u274C", a = t.rsi_5min && t.rsi_5min < 20 ? "\u2705" : "\u274C", c = e.triggers.join(" + ");
    return `\u26A1\uFE0F<b>\u4EA4\u6613\u9884\u8B66</b>\u26A1\uFE0F

\u{1F4CC} <b>\u5E01\u79CD:</b> ${e.symbol || t.symbol}
\u{1F552} <b>\u65F6\u95F4:</b> ${e.time || t.time}
\u{1F4CA} <b>\u4FE1\u53F7:</b> ${t.signal || "-"}
\u{1F4B9} <b>\u5F00\u76D8:</b> ${((l = t.open) == null ? void 0 : l.toFixed(4)) || "-"}
\u{1F4C8} <b>\u6700\u9AD8:</b> ${((u = t.high) == null ? void 0 : u.toFixed(4)) || "-"}
\u{1F4C9} <b>\u6700\u4F4E:</b> ${((d = t.low) == null ? void 0 : d.toFixed(4)) || "-"}
\u{1F514} <b>\u6536\u76D8:</b> ${((g = t.close) == null ? void 0 : g.toFixed(4)) || "-"}
\u{1F4E6} <b>\u6210\u4EA4\u91CF:</b> ${e.data.volume || t.volume}
\u{1F4D0} <b>\u6CE2\u52A8:</b> ${r}%
\u{1F4C9} <b>\u6DA8\u8DCC\u5E45:</b> ${e.data.changePercent || t.change}
\u{1F4CD} <b>SAR:</b> ${((y = t.sar) == null ? void 0 : y.toFixed(4)) || "-"} (\u5DEE\u503C:${o})
\u{1F4CA} <b>RSI(5m):</b> ${e.data.rsi5min || t.rsi_5min || "-"}
\u{1F4CA} <b>RSI(1h):</b> ${t.rsi_1h || "-"}
\u{1F4CC} <b>\u72B6\u6001:</b> ${c}
\u{1F6A8} <b>\u65B0\u9AD8:</b> ${n}
\u{1F6A8} <b>\u65B0\u4F4E:</b> ${a}

\u{1F514} <b>\u89E6\u53D1\u6761\u4EF6:</b>
${e.triggers.map((p) => `\u2022 ${p}`).join(`
`)}

\u{1F4A1} <b>\u91CF\u80FD\u7EA7\u522B:</b> ${e.data.volumeLevel}
\u26A1\uFE0F <b>SAR\u53D8\u5316:</b> ${e.data.sarChangePercent}`;
  }
  async sendMultipleAlerts(e, t) {
    let r = 0;
    console.log(`\u{1F4E8} \u51C6\u5907\u53D1\u9001 ${e.length} \u6761\u9884\u8B66\u5230Telegram...`);
    for (let o = 0; o < e.length; o++) {
      const n = e[o], a = t.get(n.index);
      a ? (console.log(`   [${o + 1}/${e.length}] ${n.symbol} ${n.time} (index=${n.index})`), await this.sendAlert(n, a) && r++, await this.delay(1e3)) : console.log(`   [${o + 1}/${e.length}] \u26A0\uFE0F  \u8DF3\u8FC7\uFF1A\u627E\u4E0D\u5230K\u7EBF\u6570\u636E (index=${n.index})`);
    }
    return console.log(`\u{1F4E8} \u53D1\u9001\u5B8C\u6210\uFF1A\u6210\u529F ${r}/${e.length} \u6761`), r;
  }
  delay(e) {
    return new Promise((t) => setTimeout(t, e));
  }
  async testConnection() {
    try {
      const t = await (await fetch(`${this.apiUrl}/getMe`)).json();
      return t.ok ? (console.log("\u2705 Telegram\u8FDE\u63A5\u6210\u529F:", t.result.username), true) : (console.error("\u274C Telegram\u8FDE\u63A5\u5931\u8D25:", t), false);
    } catch (e) {
      return console.error("\u274C Telegram\u8FDE\u63A5\u5F02\u5E38:", e), false;
    }
  }
  async sendPositionAlert(e) {
    try {
      const t = this.buildPositionAlertMessage(e), o = await (await fetch(`${this.apiUrl}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: this.chatId, text: t, parse_mode: "HTML" }) })).json();
      return o.ok ? (console.log(`\u2705 \u6301\u4ED3\u63D0\u9192\u5DF2\u53D1\u9001: ${e.position.symbol} ${e.alertType}`), true) : (console.error("\u274C \u6301\u4ED3\u63D0\u9192\u53D1\u9001\u5931\u8D25:", JSON.stringify(o)), false);
    } catch (t) {
      return console.error("\u274C \u6301\u4ED3\u63D0\u9192\u53D1\u9001\u5F02\u5E38:", t), false;
    }
  }
  buildPositionAlertMessage(e) {
    const { position: t, alertType: r, klineTime: o, currentPrice: n, sarChangePercent: a, changePercent: c, rsi5min: i, profitPercent: l } = e, u = r === "LONG_TOP", d = u ? "\u{1F534}" : "\u{1F7E2}";
    return `
${d} <b>${u ? "\u591A\u5355\u89C1\u9876\u9884\u8B66" : "\u7A7A\u5355\u89C1\u5E95\u9884\u8B66"}</b> ${d}

\u{1F4CA} <b>\u5E01\u79CD</b>: ${t.symbol}
\u{1F4B0} <b>\u6301\u4ED3\u7C7B\u578B</b>: ${t.position_type === "LONG" ? "\u591A\u5355\u{1F7E2}" : "\u7A7A\u5355\u{1F534}"}
\u{1F3AF} <b>\u5F00\u4ED3\u4EF7\u683C</b>: $${t.entry_price.toFixed(4)}
\u{1F4B5} <b>\u5F53\u524D\u4EF7\u683C</b>: $${n.toFixed(4)}
\u{1F4C8} <b>\u76C8\u4E8F</b>: ${parseFloat(l) >= 0 ? "+" : ""}${l}%

\u26A0\uFE0F <b>\u9884\u8B66\u4FE1\u53F7</b>:
\u251C\u2500 SAR\u53D8\u5316: ${a.toFixed(2)}%
\u251C\u2500 \u6DA8\u8DCC\u5E45: ${c.toFixed(2)}%
\u2514\u2500 RSI(5m): ${i.toFixed(2)} ${u ? "(\u8D85\u4E70\u2B06\uFE0F)" : "(\u8D85\u5356\u2B07\uFE0F)"}

\u{1F550} <b>\u89E6\u53D1\u65F6\u95F4</b>: ${o}

${u ? "\u26A0\uFE0F <b>\u591A\u5355\u8B66\u544A</b>: SAR\u4E0A\u6DA8\u4F46\u4EF7\u683C\u56DE\u8C03\uFF0CRSI\u8D85\u4E70(>70)\uFF0C\u53EF\u80FD\u89C1\u9876\uFF01" : "\u26A0\uFE0F <b>\u7A7A\u5355\u8B66\u544A</b>: SAR\u4E0B\u8DCC\u4F46\u4EF7\u683C\u53CD\u5F39\uFF0CRSI\u8D85\u5356(<30)\uFF0C\u53EF\u80FD\u89C1\u5E95\uFF01"}

\u{1F4A1} <b>\u5EFA\u8BAE\u6B62\u76C8</b>

${t.notes ? `\u{1F4DD} \u5907\u6CE8: ${t.notes}` : ""}
    `.trim();
  }
  async sendTradingSignal(e) {
    try {
      const t = this.buildTradingSignalMessage(e), o = await (await fetch(`${this.apiUrl}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: this.chatId, text: t, parse_mode: "HTML" }) })).json();
      return o.ok ? (console.log(`\u2705 \u4E70\u5356\u70B9\u4FE1\u53F7\u5DF2\u53D1\u9001: ${e.symbol} ${e.signal_type} ${e.signal_time}`), true) : (console.error("\u274C \u4E70\u5356\u70B9\u4FE1\u53F7\u53D1\u9001\u5931\u8D25:", JSON.stringify(o)), false);
    } catch (t) {
      return console.error("\u274C \u4E70\u5356\u70B9\u4FE1\u53F7\u53D1\u9001\u5F02\u5E38:", t), false;
    }
  }
  buildTradingSignalMessage(e) {
    const t = e.signal_type === "BUY", r = t ? "\u{1F7E2}" : "\u{1F534}", o = t ? "\u505A\u591A\u4FE1\u53F7" : "\u505A\u7A7A\u4FE1\u53F7";
    let n = e.details;
    if (typeof n == "string") try {
      n = JSON.parse(n);
    } catch {
      n = {};
    }
    const a = e.reason && e.reason.includes("\u4E3B\u5347\u4FE1\u53F7"), c = a ? "\u{1F680}" : r;
    return `
${c} <b>${a ? "\u4E3B\u5347\u4FE1\u53F7 \u{1F680}" : o}</b> ${c}

\u{1F4CA} <b>\u5E01\u79CD</b>: ${e.symbol}
\u{1F552} <b>\u65F6\u95F4</b>: ${e.signal_time}
\u{1F4B0} <b>\u4EF7\u683C</b>: $${parseFloat(e.price).toFixed(4)}
\u26A1\uFE0F <b>\u4FE1\u53F7\u5F3A\u5EA6</b>: ${e.strength}/100
\u{1F4DD} <b>\u539F\u56E0</b>: ${e.reason || "-"}

\u{1F4CA} <b>\u6280\u672F\u6307\u6807</b>:
\u251C\u2500 RSI(5m): ${n.rsi5min || "-"}
\u251C\u2500 \u6CE2\u52A8\u7387: ${n.volatility || "-"}
\u251C\u2500 \u91CF\u80FD: ${n.volumeLevel || "-"}
\u2514\u2500 SAR\u53D8\u5316: ${n.sarChangePercent || "-"}

${a ? `
\u{1F680} <b>\u4E3B\u5347\u4FE1\u53F7\u7279\u5F81</b>:
\u2022 \u5E01\u79CD\u4F18\u5148\u7EA7: ${n.coinLevel || "-"}
\u2022 \u4EF7\u683C\u4F4D\u7F6E: ${n.pricePosition ? (n.pricePosition * 100).toFixed(1) + "%" : "-"}
\u2022 \u4E0B\u8DCC\u5E45\u5EA6: ${n.priceDropPercent || "-"}
\u2022 \u9707\u8361\u6536\u655B: ${n.convergenceCount || "-"}
` : ""}

\u23F0 <b>\u6301\u6709\u89C2\u5BDF</b>: ${e.keep_bars || 0} \u6839K\u7EBF
    `.trim();
  }
};
var ut = class {
  static {
    __name(this, "ut");
  }
  constructor(e) {
    E(this, "coinService");
    E(this, "telegramService");
    this.coinService = e, this.telegramService = new He();
  }
  async performRoundAnalysis() {
    const e = Xt(), t = J();
    try {
      await this.coinService.shouldResetDailyExtremes() && await this.coinService.resetAllDailyData();
      let o = await this.coinService.fetchPricesFromCoinGecko(), n = Object.values(o).every((S) => S.usd_24h_change !== void 0 && S.usd_24h_change !== null), a = 0;
      for (; !n && a < 2; ) console.log(`\u6570\u636E\u4E0D\u5B8C\u6574,\u91CD\u8BD5\u7B2C ${a + 1} \u6B21...`), await new Promise((S) => setTimeout(S, 2e3)), o = await this.coinService.fetchPricesFromCoinGecko(), n = Object.values(o).every((S) => S.usd_24h_change !== void 0 && S.usd_24h_change !== null), a++;
      n || console.warn("\u26A0\uFE0F  \u8B66\u544A: \u90E8\u5206\u5E01\u79CD\u768424\u5C0F\u65F6\u6DA8\u8DCC\u5E45\u6570\u636E\u7F3A\u5931");
      const c = [];
      let i = 0, l = 0, u = 0, d = 0, g = 0, y = 0;
      for (const [S, T] of Object.entries(o)) {
        const v = Zs(S);
        if (!v) continue;
        await this.coinService.savePriceRecord(v, T);
        const f = await this.coinService.getPreviousPriceRecord(v);
        let R = 0, A = 0;
        f && (A = T.usd - f.price, R = A / f.price * 100);
        const D = R > 0, j = R < 0;
        D && i++, j && l++;
        const P = R >= 4, $ = R <= -3;
        P && u++, $ && d++;
        const I = R >= 1, q = R <= -1;
        I && g++, q && y++;
        const F = await this.coinService.getOrCreatePriceExtreme(v, T.usd);
        let le = 0, z = 0;
        T.usd > F.all_time_high ? (await this.coinService.updatePriceExtreme(v, "high", T.usd), await this.coinService.saveExtremeRecord(v, "new_high", T.usd, F.all_time_high, 0), le = 1, console.log(`\u{1F680} \u521B\u65B0\u9AD8\u9884\u8B66: ${v} - $${T.usd.toFixed(6)}`)) : await this.coinService.incrementExtremeCount(v, "high"), T.usd < F.all_time_low ? (await this.coinService.updatePriceExtreme(v, "low", T.usd), await this.coinService.saveExtremeRecord(v, "new_low", T.usd, F.all_time_low, 0), z = 1, console.log(`\u{1F4C9} \u521B\u65B0\u4F4E\u9884\u8B66: ${v} - $${T.usd.toFixed(6)}`)) : await this.coinService.incrementExtremeCount(v, "low"), P ? await this.coinService.incrementExtremeUpCount(v) : F.extreme_up_count > 0 && await this.coinService.resetExtremeUpCount(v), $ ? await this.coinService.incrementExtremeDownCount(v) : F.extreme_down_count > 0 && await this.coinService.resetExtremeDownCount(v), c.push({ symbol: v, price: T.usd, prev_price: (f == null ? void 0 : f.price) || null, change_amount: A, change_percent: R, is_green: D, is_extreme_up: P, is_extreme_down: $, is_surge: I, is_crash: q, change_24h: T.usd_24h_change || 0, new_high_count: le, new_low_count: z });
      }
      const p = c.length, _ = p > 0 ? i / p * 100 : 0;
      let b = 0;
      _ === 0 && (b = 1), c.sort((S, T) => T.change_24h - S.change_24h), c.forEach((S, T) => {
        S.rank_in_round = T + 1;
      }), await this.coinService.saveRoundStat(e, { green_count: i, red_count: l, green_ratio: _, extreme_up_count: u, extreme_down_count: d, surge_count: g, crash_count: y, risk_alert_count: b });
      const w = [];
      for (const S of c) {
        const T = await this.coinService.getPreviousRoundDetail(S.symbol);
        let v = 0, f = false, R = false, A = null;
        T && (A = T.round_time, v = (S.price - T.price) / T.price * 100, f = v >= 1, R = v <= -1);
        const D = { ...S, previous_round_time: A, change_vs_prev_round: v, is_surge_vs_prev: f ? 1 : 0, is_crash_vs_prev: R ? 1 : 0 };
        w.push(D), await this.coinService.saveCoinRoundDetail(S.symbol, e, D);
      }
      return await this.updateDailyStats(t, w, g, y), await this.updateCoinPriorities(w), { success: true, roundTime: e, greenCount: i, redCount: l, greenRatio: _, extremeUpCount: u, extremeDownCount: d, surgeCount: g, crashCount: y, riskAlertCount: b };
    } catch (r) {
      return console.error("Analysis error:", r), { success: false, error: r.message };
    }
  }
  async updateDailyStats(e, t, r, o) {
    for (const n of t) {
      const c = (await this.coinService.getTodayStats(e)).find((b) => b.symbol === n.symbol), i = ((c == null ? void 0 : c.total_surges) || 0) + (n.is_surge_vs_prev ? 1 : 0), l = ((c == null ? void 0 : c.total_crashes) || 0) + (n.is_crash_vs_prev ? 1 : 0), u = ((c == null ? void 0 : c.new_high_count) || 0) + n.new_high_count, d = ((c == null ? void 0 : c.new_low_count) || 0) + n.new_low_count, { trend: g, strength: y, starRating: p, starType: _ } = this.calculateMarketTrend(i, l, u, d);
      await this.coinService.updateDailyStat(e, n.symbol, { total_surges: i, total_crashes: l, new_high_count: u, new_low_count: d, market_trend: g, trend_strength: y, star_rating: p, star_type: _ });
    }
  }
  calculateMarketTrend(e, t, r, o) {
    let n = "\u65E0\u5E8F\u9707\u8361", a = 0, c = 0, i = null;
    const l = r - o;
    if (e >= 10) {
      const u = e - t;
      a = t > 0 ? u / t : u, l >= 3 ? n = "\u5355\u8FB9\u4E3B\u5347" : l >= 1 && (n = "\u9707\u8361\u504F\u591A"), i = "\u6025\u6DA8", a >= 1 && a < 2 ? c = 1 : a >= 2 && a < 3 ? c = 2 : a >= 3 && (c = 3);
    } else if (t >= 10) {
      const u = t - e;
      a = e > 0 ? u / e : u;
      const d = o - r;
      d >= 3 ? n = "\u5355\u8FB9\u4E3B\u8DCC" : d >= 1 && (n = "\u9707\u8361\u504F\u7A7A"), i = "\u6025\u8DCC", a >= 1 && a < 2 ? c = 1 : a >= 2 && a < 3 ? c = 2 : a >= 3 && (c = 3);
    }
    return { trend: n, strength: a, starRating: c, starType: i };
  }
  async updateCoinPriorities(e) {
    const t = await this.coinService.getAllPriceExtremes();
    for (const r of e) {
      const o = t.find((i) => i.symbol === r.symbol);
      if (!o) continue;
      const n = r.price / o.all_time_low * 100, a = r.price / o.all_time_high * 100, c = this.calculateCoinLevel(n, a);
      await this.coinService.updateCoinPriority(r.symbol, c, n, a);
    }
  }
  calculateCoinLevel(e, t) {
    return e >= 120 && t >= 90 ? 1 : e >= 120 && t >= 80 ? 2 : e >= 110 && t >= 90 ? 3 : e >= 110 && t >= 80 ? 4 : e < 110 && t >= 90 ? 5 : 6;
  }
  async getDashboardData() {
    const t = (await this.coinService.getLatestRoundStats(1))[0], r = t ? await this.coinService.getLatestCoinDetails(t.round_time) : [], o = J(), n = await this.coinService.getTodayStats(o), a = await this.coinService.getAllPriceExtremes(), c = await this.coinService.getAllCoinPriorities(), i = r.map((S) => {
      const T = n.find((f) => f.symbol === S.symbol), v = a.find((f) => f.symbol === S.symbol);
      return { ...S, today_surge_count: (T == null ? void 0 : T.total_surges) || 0, today_crash_count: (T == null ? void 0 : T.total_crashes) || 0, extreme_up_count: (v == null ? void 0 : v.extreme_up_count) || 0, extreme_down_count: (v == null ? void 0 : v.extreme_down_count) || 0 };
    }), l = i.length, u = i.filter((S) => S.change_24h >= 10).length, d = i.filter((S) => S.change_24h <= -10).length, g = l > 0 ? (u / l * 100).toFixed(1) : "0.0", y = l > 0 ? (d / l * 100).toFixed(1) : "0.0", p = await this.coinService.getTodayExtremeCount(o, "high"), _ = await this.coinService.getTodayExtremeCount(o, "low"), b = await this.coinService.getTodayV1Counts(o), w = i.map((S) => ({ ...S, today_v1_count: b[S.symbol] || 0 }));
    return { latestRound: t, coinDetails: w, todayStats: n, extremes: a, priorities: c, specialStats: { change24hOver10Up: u, change24hOver10Down: d, change24hOver10UpPercent: g, change24hOver10DownPercent: y, todayNewHighCount: p, todayNewLowCount: _ } };
  }
  async getDashboardDataByRound(e) {
    const t = await this.coinService.getRoundStatByTime(e);
    if (!t) throw new Error("\u6307\u5B9A\u8F6E\u6B21\u4E0D\u5B58\u5728");
    const r = await this.coinService.getLatestCoinDetails(e), o = lt(e), n = await this.coinService.getTodayStats(o), a = await this.coinService.getAllPriceExtremes(), c = await this.coinService.getAllCoinPriorities();
    return { latestRound: t, coinDetails: r, todayStats: n, extremes: a, priorities: c, isHistorical: true, historicalRoundTime: e };
  }
};
var Qs = class {
  static {
    __name(this, "Qs");
  }
  constructor() {
    E(this, "AF", 0.02);
    E(this, "MAX_AF", 0.2);
    E(this, "PERIOD_MS", 300 * 1e3);
    E(this, "MAX_SIGNAL", 100);
    E(this, "RSI_PERIOD", 14);
    E(this, "BOLL_PERIOD", 20);
    E(this, "BOLL_K", 2);
  }
  formatTime(e) {
    return new Date(parseInt(e.toString()) + this.PERIOD_MS).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  }
  calculateRSI(e, t = this.RSI_PERIOD) {
    const r = [], o = [], n = [];
    for (let i = 1; i <= t; i++) {
      const l = e[i] - e[i - 1];
      o.push(l > 0 ? l : 0), n.push(l < 0 ? -l : 0);
    }
    let a = o.reduce((i, l) => i + l, 0) / t, c = n.reduce((i, l) => i + l, 0) / t;
    r[t] = 100 - 100 / (1 + a / c);
    for (let i = t + 1; i < e.length; i++) {
      const l = e[i] - e[i - 1], u = l > 0 ? l : 0, d = l < 0 ? -l : 0;
      a = (a * (t - 1) + u) / t, c = (c * (t - 1) + d) / t, r[i] = 100 - 100 / (1 + a / c);
    }
    for (let i = 0; i < t; i++) r[i] = null;
    return r;
  }
  calculateBollingerBands(e, t = this.BOLL_PERIOD, r = this.BOLL_K) {
    const o = [];
    for (let n = 0; n < e.length; n++) {
      if (n < t - 1) {
        o.push({ MB: null, UB: null, LB: null });
        continue;
      }
      const a = e.slice(n - t + 1, n + 1), c = a.reduce((u, d) => u + d, 0) / t, i = a.reduce((u, d) => u + Math.pow(d - c, 2), 0) / t, l = Math.sqrt(i);
      o.push({ MB: c, UB: c + r * l, LB: c - r * l });
    }
    return o;
  }
  getChannelState(e, t, r, o, n, a) {
    const i = ((y, p) => {
      const _ = (y + p) / 2 * 1e-3;
      return Math.atan((p - y) / _) * 180 / Math.PI;
    })(r, o), l = e - n, d = (t - a - l) / l * 100;
    let g = "\u4E2D\u6027";
    return i > 5 && d > 3 ? g = "\u4E0A\u5347\u901A\u9053 \u{1F4C8}" : i < -5 && d > 3 ? g = "\u4E0B\u964D\u901A\u9053 \u{1F4C9}" : Math.abs(i) < 5 && d < -3 ? g = "\u9707\u8361\u6536\u655B \u{1F501}" : Math.abs(i) < 5 && d > 3 ? g = "\u653E\u91CF\u7A81\u7834 \u26A1" : i > 5 && d < -3 ? g = "\u4E0A\u5347\u8870\u7AED \u26A0\uFE0F" : i < -5 && d < -3 && (g = "\u4E0B\u8DCC\u8870\u7AED \u26A0\uFE0F"), { angle_MB: parseFloat(i.toFixed(2)), width_change: parseFloat(d.toFixed(2)), state: g };
  }
  calculateSARRSIBoll(e, t) {
    const r = [];
    let o = true, n = parseFloat(e[0][3]), a = this.AF, c = parseFloat(e[0][2]), i = null, l = 0;
    const u = e.map((p) => parseFloat(p[4])), d = this.calculateRSI(u), g = this.calculateBollingerBands(u), y = Array(u.length).fill(null);
    for (let p = 11; p < u.length; p++) {
      const _ = u.slice(p - 11, p + 1), b = this.calculateRSI(_), w = b[b.length - 1];
      w !== null && (y[p] = parseFloat(w.toFixed(2)));
    }
    for (let p = 1; p < e.length; p++) {
      const _ = parseFloat(e[p][1]), b = parseFloat(e[p][2]), w = parseFloat(e[p][3]), S = parseFloat(e[p][4]);
      let T = i;
      o ? (n = n + a * (c - n), w < n ? (o = false, n = c, c = w, a = this.AF, T = "\u7A7A\u5934", l = 0) : (b > c && (c = b), a = Math.min(a + this.AF, this.MAX_AF), i !== "\u591A\u5934" && (l = 0), T = "\u591A\u5934")) : (n = n + a * (c - n), b > n ? (o = true, n = c, c = b, a = this.AF, T = "\u591A\u5934", l = 0) : (w < c && (c = w), a = Math.min(a + this.AF, this.MAX_AF), i !== "\u7A7A\u5934" && (l = 0), T = "\u7A7A\u5934")), i === T && (l = (l + 1) % (this.MAX_SIGNAL + 1)), i = T;
      const v = g[p] || { MB: null, UB: null, LB: null }, f = g[p - 1] || v;
      let R = null, A = null;
      p > 1 && r.length > 0 && (R = n - r[r.length - 1].sar, v.UB !== null && v.LB !== null && (A = R / (v.UB - v.LB) * 100));
      let D = { angle_MB: null, width_change: null, state: "\u65E0\u6570\u636E" };
      f.MB !== null && v.MB !== null && (D = this.getChannelState(f.UB, v.UB, f.MB, v.MB, f.LB, v.LB));
      const j = ((S - _) / _ * 100).toFixed(2) + "%", P = ((b - w) / _ * 100).toFixed(2), $ = v.MB !== null ? v.MB - n : null;
      r.push({ symbol: t, index: p, time: this.formatTime(e[p][0]), open: _, high: b, low: w, close: S, volume: e[p][5], sar: n, sarChange: R ? parseFloat(R.toFixed(4)) : null, sarChangePercent: A ? parseFloat(A.toFixed(2)) : null, signal: `${i}${l.toString().padStart(2, "0")}`, rsi_5min: d[p] ? parseFloat(d[p].toFixed(2)) : null, rsi_1h: y[p] ? y[p] : null, change: j, "change-diff": parseFloat(P), boll_mb: v.MB ? parseFloat(v.MB.toFixed(4)) : null, boll_ub: v.UB ? parseFloat(v.UB.toFixed(4)) : null, boll_lb: v.LB ? parseFloat(v.LB.toFixed(4)) : null, boll_sar_diff: $ ? parseFloat($.toFixed(4)) : null, boll_angle_mb: D.angle_MB, boll_width_change: D.width_change, channel_state: D.state, down_channel_exhaustion_ratio: null, up_channel_exhaustion_ratio: null });
    }
    return r.forEach((p, _) => {
      const b = _ + 1, w = e[b], S = (w == null ? void 0 : w.volume_v1) !== void 0 ? w.volume_v1 : 0, T = (w == null ? void 0 : w.volume_v2) !== void 0 ? w.volume_v2 : 0;
      p.volume_v1 = S, p.volume_v2 = T, p.is_v1 = S === 1, p.is_v2 = T === 1, p.volume_level = S === 1 ? "V1" : T === 1 ? "V2" : "Normal";
    }), r.forEach((p, _) => {
      const b = Math.max(0, _ - 39), w = _ + 1, S = r.slice(b, w), T = S.length;
      let v = 0, f = 0;
      S.forEach((D) => {
        const j = D.channel_state;
        (j === "\u4E0B\u964D\u901A\u9053 \u{1F4C9}" || j === "\u4E0B\u8DCC\u8870\u7AED \u26A0\uFE0F") && v++, (j === "\u4E0A\u5347\u901A\u9053 \u{1F4C8}" || j === "\u4E0A\u5347\u8870\u7AED \u26A0\uFE0F") && f++;
      });
      const R = T > 0 ? v / T * 100 : 0, A = T > 0 ? f / T * 100 : 0;
      p.down_channel_exhaustion_ratio = parseFloat(R.toFixed(2)), p.up_channel_exhaustion_ratio = parseFloat(A.toFixed(2));
    }), r;
  }
};
var zt = { BTC: { v1: 2e5, v2: 1e5 }, ETH: { v1: 13e5, v2: 5e5 }, XRP: { v1: 2e5, v2: 87e3 }, SOL: { v1: 351620, v2: 246380 }, BNB: { v1: 2388300, v2: 1737500 }, LTC: { v1: 5e4, v2: 15e3 }, DOGE: { v1: 15e4, v2: 6e4 }, SUI: { v1: 2e6, v2: 8e5 }, TRX: { v1: 13280, v2: 6022 }, TON: { v1: 35e4, v2: 2e5 }, ETC: { v1: 12e3, v2: 2e3 }, BCH: { v1: 103500, v2: 5e4 }, HBAR: { v1: 103500, v2: 4e4 }, XLM: { v1: 103500, v2: 3e4 }, FIL: { v1: 5003500, v2: 37e5 }, ADA: { v1: 67210, v2: 44230 }, LINK: { v1: 28e4, v2: 2e5 }, CRO: { v1: 1e5, v2: 4e4 }, DOT: { v1: 3e5, v2: 25e4 }, UNI: { v1: 14e4, v2: 1e5 }, NEAR: { v1: 1e5, v2: 5e4 }, APT: { v1: 3e5, v2: 2e5 }, CFX: { v1: 3e5, v2: 25e4 }, CRV: { v1: 15e5, v2: 1e6 }, STX: { v1: 5e4, v2: 3e4 }, LDO: { v1: 1e6, v2: 6e5 }, TAO: { v1: 3e5, v2: 18e4 }, AAVE: { v1: 1e5, v2: 5e4 }, OKB: { v1: 1e5, v2: 5e4 } };
function er(s) {
  var e;
  return ((e = zt[s]) == null ? void 0 : e.v1) || 1e5;
}
__name(er, "er");
function tr(s) {
  var e;
  return ((e = zt[s]) == null ? void 0 : e.v2) || 5e4;
}
__name(tr, "tr");
function sr(s, e) {
  return e > er(s);
}
__name(sr, "sr");
function rr(s, e) {
  return e > tr(s);
}
__name(rr, "rr");
var B = class {
  static {
    __name(this, "B");
  }
  constructor(e) {
    E(this, "db");
    E(this, "indicatorService");
    this.db = e, this.indicatorService = new Qs();
  }
  async fetchKlineFromOKX(e, t = "5m", r = 300) {
    const o = `https://www.okx.com/api/v5/market/candles?instId=${e}&bar=${t}&limit=${r}`, n = await fetch(o, { headers: { Accept: "application/json" } });
    if (!n.ok) throw new Error(`OKX API error: ${n.status}`);
    const a = await n.json();
    if (a.code !== "0") throw new Error(`OKX API error: ${a.msg}`);
    return a.data;
  }
  async saveKlineData(e, t, r) {
    if (r.length === 0) return;
    const o = r.map((n) => {
      const [a, c, i, l, u, d, g, y] = n, p = parseFloat(d), _ = sr(e, p) ? 1 : 0, b = rr(e, p) ? 1 : 0;
      return this.db.prepare(`
        INSERT OR IGNORE INTO kline_data (
          symbol, timeframe, open_time, open, high, low, close, volume,
          quote_volume, trades_count, volume_v1, volume_v2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(e, t, parseInt(a), parseFloat(c), parseFloat(i), parseFloat(l), parseFloat(u), p, parseFloat(y || "0"), 0, _, b);
    });
    await this.db.batch(o);
  }
  async getKlineData(e, t, r = 100) {
    return (await this.db.prepare(`
        SELECT * FROM kline_data 
        WHERE symbol = ? AND timeframe = ?
        ORDER BY open_time DESC 
        LIMIT ?
      `).bind(e, t, r).all()).results;
  }
  async getLatestKlineTime(e, t) {
    const r = await this.db.prepare(`
        SELECT MAX(open_time) as latest_time 
        FROM kline_data 
        WHERE symbol = ? AND timeframe = ?
      `).bind(e, t).first();
    return (r == null ? void 0 : r.latest_time) || 0;
  }
  async getOKXConfig(e) {
    return await this.db.prepare("SELECT * FROM okx_config WHERE symbol = ?").bind(e).first();
  }
  async getAllOKXConfigs() {
    return (await this.db.prepare("SELECT * FROM okx_config").all()).results;
  }
  async syncAllKlineData(e = "5m", t = 300) {
    const r = await this.getAllOKXConfigs(), o = [];
    for (let n = 0; n < r.length; n++) {
      const a = r[n];
      try {
        const c = await this.fetchKlineFromOKX(a.okx_symbol, e, t);
        await this.saveKlineData(a.symbol, e, c), await this.cleanOldKlineDataByDays(a.symbol, e, 30), o.push({ symbol: a.symbol, success: true, count: c.length }), n < r.length - 1 && await new Promise((i) => setTimeout(i, 100));
      } catch (c) {
        o.push({ symbol: a.symbol, success: false, error: c.message });
      }
    }
    return o;
  }
  async getKlineStats(e, t, r = 100) {
    const o = await this.getKlineData(e, t, r);
    if (o.length === 0) return null;
    const n = o[0], a = o[o.length - 1], c = (n.close - a.open) / a.open * 100;
    let i = o[0].high, l = o[0].low, u = 0;
    for (const d of o) d.high > i && (i = d.high), d.low < l && (l = d.low), u += d.volume;
    return { symbol: e, timeframe: t, dataCount: o.length, latestPrice: n.close, latestTime: n.open_time, changePercent: c, highest: i, lowest: l, totalVolume: u, avgVolume: u / o.length };
  }
  async getMultiTimeframeData(e) {
    const t = ["5m", "15m", "1H", "4H", "1D"], r = {};
    for (const o of t) {
      const n = await this.getKlineStats(e, o, 100);
      n && (r[o] = n);
    }
    return r;
  }
  async cleanOldKlineData(e, t, r = 1e3) {
    await this.db.prepare(`
        DELETE FROM kline_data 
        WHERE symbol = ? AND timeframe = ? 
        AND open_time < (
          SELECT open_time FROM kline_data 
          WHERE symbol = ? AND timeframe = ?
          ORDER BY open_time DESC 
          LIMIT 1 OFFSET ?
        )
      `).bind(e, t, e, t, r).run();
  }
  async cleanOldKlineDataByDays(e, t, r = 30) {
    const o = Date.now() - r * 24 * 60 * 60 * 1e3;
    await this.db.prepare(`
        DELETE FROM kline_data 
        WHERE symbol = ? AND timeframe = ? 
        AND open_time < ?
      `).bind(e, t, o).run();
  }
  async getKlineWithIndicators(e, t = "5m", r = 300) {
    const n = r + 50, a = await this.getKlineData(e, t, n);
    let c;
    if (a && a.length >= n) c = a.reverse().map((u) => {
      const d = [u.open_time.toString(), u.open.toString(), u.high.toString(), u.low.toString(), u.close.toString(), u.volume.toString()];
      return d.volume_v1 = u.volume_v1, d.volume_v2 = u.volume_v2, d;
    });
    else {
      const u = await this.getOKXConfig(e);
      if (!u) throw new Error(`\u672A\u627E\u5230 ${e} \u7684 OKX \u914D\u7F6E`);
      c = await this.fetchKlineFromOKX(u.okx_symbol, t, n);
    }
    let l = this.indicatorService.calculateSARRSIBoll(c, e).slice(-r);
    return l = l.reverse(), l = l.map((u, d) => ({ ...u, index: d })), { symbol: e, timeframe: t, dataCount: l.length, data: l };
  }
  async getMultiSymbolIndicators(e, t = "5m", r = 300) {
    const o = {};
    for (const n of e) try {
      const a = await this.getKlineWithIndicators(n, t, r);
      o[n] = { success: true, data: a };
    } catch (a) {
      o[n] = { success: false, error: a.message };
    }
    return o;
  }
  async fetchHistoricalKline(e, t = "5m", r = 576) {
    const n = Math.ceil(r / 300);
    let a = [], c = null;
    for (let i = 0; i < n; i++) {
      const l = Math.min(300, r - a.length);
      let u = `https://www.okx.com/api/v5/market/candles?instId=${e}&bar=${t}&limit=${l}`;
      c && (u += `&after=${c}`);
      const d = await fetch(u, { headers: { Accept: "application/json" } });
      if (!d.ok) throw new Error(`OKX API error: ${d.status}`);
      const g = await d.json();
      if (g.code !== "0") throw new Error(`OKX API error: ${g.msg}`);
      const y = g.data;
      if (!y || y.length === 0 || (a = a.concat(y), c = y[y.length - 1][0], a.length >= r)) break;
      await new Promise((p) => setTimeout(p, 100));
    }
    return a;
  }
  async sync48HoursData(e) {
    const t = await this.getOKXConfig(e);
    if (!t) throw new Error(`\u672A\u627E\u5230 ${e} \u7684 OKX \u914D\u7F6E`);
    console.log(`\u5F00\u59CB\u540C\u6B65 ${e} \u768448\u5C0F\u65F6\u6570\u636E...`);
    const r = await this.fetchHistoricalKline(t.okx_symbol, "5m", 576);
    return await this.saveKlineData(e, "5m", r), console.log(`${e} \u540C\u6B65\u5B8C\u6210\uFF0C\u5171 ${r.length} \u6839K\u7EBF`), { symbol: e, success: true, count: r.length };
  }
  async syncAll48HoursData() {
    const e = await this.getAllOKXConfigs(), t = [];
    for (const r of e) {
      try {
        const o = await this.sync48HoursData(r.symbol);
        t.push(o);
      } catch (o) {
        t.push({ symbol: r.symbol, success: false, error: o.message });
      }
      await new Promise((o) => setTimeout(o, 200));
    }
    return t;
  }
};
var Jt = class {
  static {
    __name(this, "Jt");
  }
  constructor(e) {
    E(this, "db");
    this.db = e;
  }
  async recordConvergence(e) {
    try {
      return await this.db.prepare(`
          INSERT OR IGNORE INTO convergence_stats 
          (symbol, timeframe, convergence_time, boll_width, boll_width_percent, 
           boll_upper, boll_middle, boll_lower, close_price, rsi_5min, sar_direction)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(e.symbol, e.timeframe, e.convergence_time, e.boll_width, e.boll_width_percent, e.boll_upper, e.boll_middle, e.boll_lower, e.close_price, e.rsi_5min || null, e.sar_direction || null).run(), true;
    } catch (t) {
      return console.error("\u8BB0\u5F55\u9707\u8361\u6536\u655B\u6570\u636E\u5931\u8D25:", t), false;
    }
  }
  async recordMultipleConvergence(e) {
    let t = 0;
    for (const r of e) await this.recordConvergence(r) && t++;
    return t;
  }
  async getConvergenceStats(e, t = 30) {
    try {
      const r = Ye(t), o = await this.db.prepare(`
          SELECT 
            symbol,
            COUNT(*) as total_count,
            AVG(boll_width) as avg_width,
            MIN(boll_width) as min_width,
            MAX(boll_width) as max_width,
            AVG(boll_width_percent) as avg_width_percent,
            MIN(boll_width_percent) as min_width_percent,
            MAX(boll_width_percent) as max_width_percent
          FROM convergence_stats
          WHERE symbol = ? AND DATE(created_at) >= ?
          GROUP BY symbol
        `).bind(e, r).first();
      if (!o) return null;
      const n = await this.db.prepare(`
          SELECT *
          FROM convergence_stats
          WHERE symbol = ? AND DATE(created_at) >= ?
          ORDER BY created_at DESC
          LIMIT 20
        `).bind(e, r).all();
      return { symbol: o.symbol, total_count: o.total_count, avg_width: o.avg_width, min_width: o.min_width, max_width: o.max_width, avg_width_percent: o.avg_width_percent, min_width_percent: o.min_width_percent, max_width_percent: o.max_width_percent, recent_records: n.results || [] };
    } catch (r) {
      return console.error("\u83B7\u53D6\u9707\u8361\u6536\u655B\u7EDF\u8BA1\u5931\u8D25:", r), null;
    }
  }
  async getAllConvergenceStats(e = 30) {
    try {
      const t = Ye(e), r = await this.db.prepare(`
          SELECT 
            symbol,
            COUNT(*) as total_count,
            AVG(boll_width) as avg_width,
            MIN(boll_width) as min_width,
            MAX(boll_width) as max_width,
            AVG(boll_width_percent) as avg_width_percent,
            MIN(boll_width_percent) as min_width_percent,
            MAX(boll_width_percent) as max_width_percent
          FROM convergence_stats
          WHERE DATE(created_at) >= ?
          GROUP BY symbol
          ORDER BY symbol
        `).bind(t).all(), o = {};
      return (r.results || []).forEach((n) => {
        o[n.symbol] = { symbol: n.symbol, total_count: n.total_count, avg_width: n.avg_width, min_width: n.min_width, max_width: n.max_width, avg_width_percent: n.avg_width_percent, min_width_percent: n.min_width_percent, max_width_percent: n.max_width_percent, recent_records: [] };
      }), o;
    } catch (t) {
      return console.error("\u83B7\u53D6\u6240\u6709\u9707\u8361\u6536\u655B\u7EDF\u8BA1\u5931\u8D25:", t), {};
    }
  }
  async getTodayConvergenceCount(e) {
    try {
      const t = J(), r = await this.db.prepare(`
          SELECT COUNT(*) as count
          FROM convergence_stats
          WHERE symbol = ? AND DATE(created_at) = ?
        `).bind(e, t).first();
      return (r == null ? void 0 : r.count) || 0;
    } catch (t) {
      return console.error("\u83B7\u53D6\u4ECA\u65E5\u9707\u8361\u6536\u655B\u6B21\u6570\u5931\u8D25:", t), 0;
    }
  }
  async cleanOldData(e = 90) {
    try {
      const t = Ye(e), r = await this.db.prepare(`
          DELETE FROM convergence_stats
          WHERE DATE(created_at) < ?
        `).bind(t).run();
      return console.log(`\u2705 \u6E05\u7406\u4E86 ${r.meta.changes} \u6761\u65E7\u7684\u9707\u8361\u6536\u655B\u8BB0\u5F55`), r.meta.changes || 0;
    } catch (t) {
      return console.error("\u6E05\u7406\u65E7\u6570\u636E\u5931\u8D25:", t), 0;
    }
  }
};
var dt = Object.freeze(Object.defineProperty({ __proto__: null, ConvergenceStatsService: Jt }, Symbol.toStringTag, { value: "Module" }));
var Qe = class {
  static {
    __name(this, "Qe");
  }
  constructor(e) {
    E(this, "db");
    E(this, "convergenceService");
    this.db = e, e && (this.convergenceService = new Jt(e));
  }
  detectTradingSignals(e, t) {
    var u;
    if (e.length < 30) return { signals: [], stats: null, alerts: [] };
    const r = [], o = [];
    if (this.convergenceService) for (let d = 0; d < e.length; d++) {
      const g = e[d];
      if (g.channel_state && g.channel_state.includes("\u9707\u8361\u6536\u655B") && g.boll_ub && g.boll_mb && g.boll_lb) {
        const y = g.boll_ub - g.boll_lb, p = y / g.boll_mb * 100;
        this.convergenceService.recordConvergence({ symbol: g.symbol, timeframe: "5m", convergence_time: g.time, boll_width: y, boll_width_percent: p, boll_upper: g.boll_ub, boll_middle: g.boll_mb, boll_lower: g.boll_lb, close_price: parseFloat(g.close), rsi_5min: g.rsi_5min, sar_direction: g.signal }).catch((_) => {
          console.error(`\u8BB0\u5F55${g.symbol}\u9707\u8361\u6536\u655B\u6570\u636E\u5931\u8D25:`, _);
        });
      }
    }
    const n = e.map((d) => parseFloat(d.volume || "0")), a = n.reduce((d, g) => d + g, 0) / n.length, c = a * 1.5, i = a * 1;
    for (let d = 1; d < e.length; d++) {
      const g = e[d], y = e[d - 1], p = parseFloat(g.high), _ = parseFloat(g.low), b = parseFloat(g.open), w = parseFloat(g.close), S = parseFloat(g.volume || "0");
      parseFloat(y.high), parseFloat(y.low);
      const T = parseFloat(y.volume || "0"), v = (p - _) / _ * 100, f = Math.max(b, w), R = Math.min(b, w), A = p - f, D = R - _, j = Math.abs(w - b), P = A > j * 2, $ = D > j * 2, I = parseFloat(g.sarChangePercent || "0"), q = parseFloat(((u = g.change) == null ? void 0 : u.replace("%", "")) || "0"), F = parseFloat(g.rsi_5min || "50"), le = Math.abs(q) >= 1, z = [], ve = S >= c, we = S >= i;
      ve ? z.push("\u6210\u4EA4\u91CF\u2265V1") : we && z.push("\u6210\u4EA4\u91CF\u2265V2");
      const Qt = q >= 1, es = q <= -1;
      Qt && z.push("\u6DA8\u5E45\u22651%"), es && z.push("\u8DCC\u5E45\u2264-1%"), v >= 1 && z.push("\u9707\u8361\u22651%"), z.length > 0 && o.push({ symbol: g.symbol, time: g.time, index: g.index, triggers: z, klineData: { open: b, high: p, low: _, close: w, volume: S, boll_upper: parseFloat(g.boll_ub || "0"), boll_middle: parseFloat(g.boll_mb || "0"), boll_lower: parseFloat(g.boll_lb || "0"), rsi_1h: parseFloat(g.rsi_1h || "0"), sar_value: parseFloat(g.sar || "0"), sar_direction: g.signal || "" }, data: { volume: S.toFixed(2), volumeLevel: ve ? "V1+" : we ? "V2+" : "Normal", changePercent: q.toFixed(2) + "%", volatility: v.toFixed(2) + "%", rsi5min: F.toFixed(2), sarChangePercent: I.toFixed(2) + "%" } });
      const ts = P && F > 60, ss = P && I < 0 && Math.abs(I) > 3, rs = F > 75 && v > 1;
      (ts || ss || rs) && (ve || we || le || v > 1) && r.push({ symbol: g.symbol, time: g.time, type: "SELL", price: p, reason: "\u89C1\u9876\u4FE1\u53F7", details: { volatility: v.toFixed(2) + "%", upperShadowRatio: (A / j).toFixed(2) + "x", volumeDecay: (S / T * 100).toFixed(1) + "%", sarChangePercent: I.toFixed(2) + "%", changePercent: q.toFixed(2) + "%", rsi5min: F.toFixed(2), currentVolume: S.toFixed(2), volumeLevel: ve ? "V1+" : we ? "V2+" : "Normal" }, strength: this.calculateSignalStrength({ volatility: v, rsi: F, sarChange: Math.abs(I), volumeRatio: S / a, isTop: true }), keepBars: 10 });
      const ns = $ && F < 40, os = $ && I > 0 && Math.abs(I) > 3, as = F < 25 && v > 1;
      (ns || os || as) && (ve || we || le || v > 1) && r.push({ symbol: g.symbol, time: g.time, type: "BUY", price: _, reason: "\u89C1\u5E95\u4FE1\u53F7", details: { volatility: v.toFixed(2) + "%", lowerShadowRatio: (D / j).toFixed(2) + "x", volumeDecay: (S / T * 100).toFixed(1) + "%", sarChangePercent: I.toFixed(2) + "%", changePercent: q.toFixed(2) + "%", rsi5min: F.toFixed(2), currentVolume: S.toFixed(2), volumeLevel: ve ? "V1+" : we ? "V2+" : "Normal" }, strength: this.calculateSignalStrength({ volatility: v, rsi: F, sarChange: Math.abs(I), volumeRatio: S / a, isTop: false }), keepBars: 20 });
    }
    if (t !== void 0 && t >= 1 && t <= 2) {
      const d = [];
      for (let g = 0; g < e.length; g++) {
        const y = e[g];
        y.channel_state && y.channel_state.includes("\u9707\u8361\u6536\u655B") && d.push(g);
      }
      for (let g = 0; g < d.length - 1; g++) {
        const y = d[g], p = d[g + 1];
        if (p - y <= 3) {
          const _ = e[y], b = e[p], w = Math.max(0, p - 20), T = e.slice(w, p + 1).map((I) => parseFloat(I.close)), v = Math.max(...T), f = Math.min(...T), R = v - f, A = parseFloat(b.close), D = (A - f) / R * 100, j = D <= 30, P = (v - A) / v * 100, $ = P >= 20;
          if (j && $) {
            const I = parseFloat(b.volume || "0"), q = e.slice(0, p).reduce((F, le) => F + parseFloat(le.volume || "0"), 0) / p;
            r.push({ symbol: b.symbol, time: b.time, type: "BUY", price: parseFloat(b.close), reason: "\u4E3B\u5347\u4FE1\u53F7 \u{1F680}", details: { convergenceCount: "2\u6B21\u8FDE\u7EED", coinLevel: `\u7B49\u7EA7${t}`, pricePosition: D.toFixed(1) + "%\uFF08\u5E95\u90E8\uFF09", priceDropFromHigh: P.toFixed(1) + "%", signal1Time: _.time, signal2Time: b.time, channelState: b.channelState || "\u9707\u8361\u6536\u655B", currentVolume: I.toFixed(2), volumeRatio: (I / q).toFixed(2) + "x" }, strength: this.calculateMainRiseStrength({ coinLevel: t, pricePosition: D, priceDropPercent: P, volumeRatio: I / q }), keepBars: 30 });
          }
        }
      }
    }
    const l = { totalSignals: r.length, buySignals: r.filter((d) => d.type === "BUY").length, sellSignals: r.filter((d) => d.type === "SELL").length, totalAlerts: o.length, avgVolume: a.toFixed(2), v1Threshold: c.toFixed(2), v2Threshold: i.toFixed(2) };
    return { signals: r, alerts: o, stats: l };
  }
  calculateSignalStrength(e) {
    let t = 0;
    return e.isTop ? e.rsi > 80 ? t += 30 : e.rsi > 75 ? t += 20 : e.rsi > 70 && (t += 10) : e.rsi < 20 ? t += 30 : e.rsi < 25 ? t += 20 : e.rsi < 30 && (t += 10), e.sarChange > 20 ? t += 25 : e.sarChange > 15 ? t += 20 : e.sarChange > 10 ? t += 15 : e.sarChange > 5 && (t += 10), e.volatility > 3 ? t += 20 : e.volatility > 2 ? t += 15 : e.volatility > 1.5 ? t += 10 : e.volatility > 1 && (t += 5), e.volumeRatio > 2 ? t += 25 : e.volumeRatio > 1.5 ? t += 20 : e.volumeRatio > 1.2 ? t += 15 : e.volumeRatio > 1 && (t += 10), Math.min(100, t);
  }
  calculateMainRiseStrength(e) {
    let t = 0;
    return e.coinLevel === 1 ? t += 40 : e.coinLevel === 2 ? t += 35 : e.coinLevel === 3 ? t += 25 : e.coinLevel === 4 ? t += 15 : e.coinLevel === 5 ? t += 10 : e.coinLevel === 6 && (t += 5), e.pricePosition <= 10 ? t += 30 : e.pricePosition <= 20 ? t += 25 : e.pricePosition <= 30 ? t += 20 : e.pricePosition <= 40 && (t += 10), e.priceDropPercent >= 50 ? t += 20 : e.priceDropPercent >= 40 ? t += 18 : e.priceDropPercent >= 30 ? t += 15 : e.priceDropPercent >= 20 && (t += 10), e.volumeRatio > 1.5 ? t += 10 : e.volumeRatio > 1.2 ? t += 8 : e.volumeRatio > 1 && (t += 5), Math.min(100, t);
  }
  async detectMultiSymbolSignals(e, t) {
    const r = {}, o = /* @__PURE__ */ new Map();
    if (this.db) {
      const n = await this.db.prepare("SELECT symbol, level FROM coin_priority").all();
      n.results && n.results.forEach((a) => {
        o.set(a.symbol, a.level);
      });
    }
    for (const n of e) try {
      const a = await t(n), c = o.get(n), i = this.detectTradingSignals(a, c);
      r[n] = { success: true, ...i };
    } catch (a) {
      r[n] = { success: false, error: a.message };
    }
    return r;
  }
  generateSignalSummary(e) {
    const t = { totalSymbols: 0, totalSignals: 0, totalBuySignals: 0, totalSellSignals: 0, topBuySignals: [], topSellSignals: [], symbolsWithSignals: [] };
    for (const [r, o] of Object.entries(e)) if (o.success && o.signals) {
      t.totalSymbols++;
      const n = o.signals || [], a = n.filter((i) => i.type === "BUY"), c = n.filter((i) => i.type === "SELL");
      t.totalSignals += n.length, t.totalBuySignals += a.length, t.totalSellSignals += c.length, n.length > 0 && (t.symbolsWithSignals.push({ symbol: r, buyCount: a.length, sellCount: c.length }), a.forEach((i) => {
        i.strength >= 60 && t.topBuySignals.push({ symbol: r, ...i });
      }), c.forEach((i) => {
        i.strength >= 60 && t.topSellSignals.push({ symbol: r, ...i });
      }));
    }
    return t.topBuySignals.sort((r, o) => o.strength - r.strength), t.topSellSignals.sort((r, o) => o.strength - r.strength), t.topBuySignals = t.topBuySignals.slice(0, 10), t.topSellSignals = t.topSellSignals.slice(0, 10), t;
  }
  async saveTradingSignal(e) {
    if (this.db) try {
      const t = this.extractKlineTime(e.time);
      await this.db.prepare(`
          INSERT INTO trading_signals (
            symbol, signal_time, signal_type, price, reason, 
            strength, details, keep_bars, kline_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(e.symbol, e.time, e.type, e.price, e.reason || "", e.strength || 0, JSON.stringify(e.details || {}), e.keepBars || 0, t).run();
    } catch (t) {
      console.error("\u4FDD\u5B58\u4E70\u5356\u70B9\u4FE1\u53F7\u5931\u8D25:", t);
    }
  }
  extractKlineTime(e) {
    try {
      const t = e.split(" ");
      if (t.length !== 2) return e;
      const r = t[0], n = t[1].split(":");
      if (n.length !== 3) return e;
      const a = n[0], c = parseInt(n[1]), i = Math.floor(c / 5) * 5;
      return `${r} ${a}:${i.toString().padStart(2, "0")}:00`;
    } catch (t) {
      return console.error("\u63D0\u53D6K\u7EBF\u65F6\u95F4\u5931\u8D25:", t), e;
    }
  }
  async saveAlertSignal(e) {
    if (this.db) try {
      const t = e.klineData || {};
      await this.db.prepare(`
          INSERT INTO alert_signals (
            symbol, alert_time, kline_index, triggers,
            volume, volume_level, change_percent, volatility,
            rsi_5min, sar_change_percent,
            open_price, high_price, low_price, close_price,
            boll_upper, boll_middle, boll_lower,
            rsi_1h, sar_value, sar_direction
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(e.symbol, e.time, e.index || 0, JSON.stringify(e.triggers || []), parseFloat(e.data.volume || "0"), e.data.volumeLevel || "Normal", parseFloat(e.data.changePercent || "0"), parseFloat(e.data.volatility || "0"), parseFloat(e.data.rsi5min || "50"), parseFloat(e.data.sarChangePercent || "0"), t.open || 0, t.high || 0, t.low || 0, t.close || 0, t.boll_upper || 0, t.boll_middle || 0, t.boll_lower || 0, t.rsi_1h || 0, t.sar_value || 0, t.sar_direction || "").run();
    } catch (t) {
      console.error("\u4FDD\u5B58\u9884\u8B66\u4FE1\u53F7\u5931\u8D25:", t);
    }
  }
  async saveSignalsAndAlerts(e, t) {
    if (this.db) {
      for (const r of e) await this.saveTradingSignal(r);
      for (const r of t) await this.saveAlertSignal(r);
    }
  }
  async getRecentTradingSignals(e = 24, t = 100) {
    if (!this.db) return [];
    try {
      const r = ge();
      return (await this.db.prepare(`
          SELECT * FROM trading_signals 
          WHERE created_at >= ?
          ORDER BY created_at DESC
          LIMIT ?
        `).bind(r, t).all()).results.map((n) => ({ ...n, details: JSON.parse(n.details || "{}") }));
    } catch (r) {
      return console.error("\u83B7\u53D6\u4E70\u5356\u70B9\u4FE1\u53F7\u5931\u8D25:", r), [];
    }
  }
  async getRecentAlertSignals(e = 24, t = 1e3) {
    if (!this.db) return [];
    try {
      const r = ge();
      return (await this.db.prepare(`
          SELECT * FROM alert_signals 
          WHERE created_at >= ?
          ORDER BY alert_time DESC
          LIMIT ?
        `).bind(r, t).all()).results.map((n) => {
        var a, c, i, l, u;
        return { ...n, triggers: JSON.parse(n.triggers || "[]"), klineData: { open: n.open_price || 0, high: n.high_price || 0, low: n.low_price || 0, close: n.close_price || 0, volume: n.volume || 0, boll_upper: n.boll_upper || 0, boll_middle: n.boll_middle || 0, boll_lower: n.boll_lower || 0, rsi_1h: n.rsi_1h || 0, rsi_5min: n.rsi_5min || 0, sar_value: n.sar_value || 0, sar_direction: n.sar_direction || "" }, data: { volume: ((a = n.volume) == null ? void 0 : a.toString()) || "0", volumeLevel: n.volume_level, changePercent: ((c = n.change_percent) == null ? void 0 : c.toFixed(2)) + "%", volatility: ((i = n.volatility) == null ? void 0 : i.toFixed(2)) + "%", rsi5min: (l = n.rsi_5min) == null ? void 0 : l.toFixed(2), sarChangePercent: ((u = n.sar_change_percent) == null ? void 0 : u.toFixed(2)) + "%" } };
      });
    } catch (r) {
      return console.error("\u83B7\u53D6\u9884\u8B66\u4FE1\u53F7\u5931\u8D25:", r), [];
    }
  }
  async getUnsentTradingSignals(e, t = 2) {
    if (!this.db) return [];
    try {
      const r = ge();
      return (await this.db.prepare(`
          SELECT * FROM trading_signals 
          WHERE symbol = ? 
            AND telegram_sent = 0
            AND created_at >= ?
          ORDER BY signal_time DESC
        `).bind(e, r).all()).results.map((n) => ({ ...n, details: JSON.parse(n.details || "{}") }));
    } catch (r) {
      return console.error("\u83B7\u53D6\u672A\u53D1\u9001\u4E70\u5356\u70B9\u4FE1\u53F7\u5931\u8D25:", r), [];
    }
  }
  async getUnsentAlertSignals(e, t = 2) {
    if (!this.db) return [];
    try {
      const r = ge();
      return (await this.db.prepare(`
          SELECT * FROM alert_signals 
          WHERE symbol = ? 
            AND telegram_sent = 0
            AND created_at >= ?
          ORDER BY alert_time DESC
        `).bind(e, r).all()).results.map((n) => {
        var a, c, i, l, u;
        return { ...n, triggers: JSON.parse(n.triggers || "[]"), klineData: { open: n.open_price || 0, high: n.high_price || 0, low: n.low_price || 0, close: n.close_price || 0, volume: n.volume || 0, boll_upper: n.boll_upper || 0, boll_middle: n.boll_middle || 0, boll_lower: n.boll_lower || 0, rsi_1h: n.rsi_1h || 0, rsi_5min: n.rsi_5min || 0, sar_value: n.sar_value || 0, sar_direction: n.sar_direction || "" }, data: { volume: ((a = n.volume) == null ? void 0 : a.toString()) || "0", volumeLevel: n.volume_level, changePercent: ((c = n.change_percent) == null ? void 0 : c.toFixed(2)) + "%", volatility: ((i = n.volatility) == null ? void 0 : i.toFixed(2)) + "%", rsi5min: (l = n.rsi_5min) == null ? void 0 : l.toFixed(2), sarChangePercent: ((u = n.sar_change_percent) == null ? void 0 : u.toFixed(2)) + "%" } };
      });
    } catch (r) {
      return console.error("\u83B7\u53D6\u672A\u53D1\u9001\u9884\u8B66\u4FE1\u53F7\u5931\u8D25:", r), [];
    }
  }
  async markTradingSignalsAsSent(e) {
    if (!(!this.db || e.length === 0)) try {
      const t = e.map(() => "?").join(",");
      await this.db.prepare(`
          UPDATE trading_signals 
          SET telegram_sent = 1 
          WHERE id IN (${t})
        `).bind(...e).run(), console.log(`\u2705 \u6807\u8BB0 ${e.length} \u4E2A\u4E70\u5356\u70B9\u4FE1\u53F7\u4E3A\u5DF2\u53D1\u9001`);
    } catch (t) {
      console.error("\u6807\u8BB0\u4E70\u5356\u70B9\u4FE1\u53F7\u5931\u8D25:", t);
    }
  }
  async markAlertSignalsAsSent(e) {
    if (!(!this.db || e.length === 0)) try {
      const t = e.map(() => "?").join(",");
      await this.db.prepare(`
          UPDATE alert_signals 
          SET telegram_sent = 1 
          WHERE id IN (${t})
        `).bind(...e).run(), console.log(`\u2705 \u6807\u8BB0 ${e.length} \u4E2A\u9884\u8B66\u4FE1\u53F7\u4E3A\u5DF2\u53D1\u9001`);
    } catch (t) {
      console.error("\u6807\u8BB0\u9884\u8B66\u4FE1\u53F7\u5931\u8D25:", t);
    }
  }
  async getSignalSendConfig() {
    if (!this.db) return /* @__PURE__ */ new Map();
    try {
      const e = await this.db.prepare("SELECT signal_category, signal_type, enabled FROM signal_send_config").all(), t = /* @__PURE__ */ new Map();
      return e.results.forEach((r) => {
        const o = `${r.signal_category}:${r.signal_type}`;
        t.set(o, r.enabled === 1);
      }), t;
    } catch (e) {
      return console.error("\u83B7\u53D6\u4FE1\u53F7\u53D1\u9001\u914D\u7F6E\u5931\u8D25:", e), /* @__PURE__ */ new Map();
    }
  }
  isTimeInAllowedRange(e) {
    try {
      const t = e.replace(/\//g, "-").split(" "), r = t[0], o = t[1], n = /* @__PURE__ */ new Date(`${r}T${o}+08:00`), a = /* @__PURE__ */ new Date(), c = 480 * 60 * 1e3, i = new Date(a.getTime() + c), l = n.getUTCHours(), u = n.getUTCMinutes(), d = i.getUTCHours(), g = i.getUTCMinutes();
      if (l === d) return true;
      const y = d === 0 ? 23 : d - 1;
      return l === y && u >= 50;
    } catch (t) {
      return console.error("\u5224\u65AD\u65F6\u95F4\u8303\u56F4\u5931\u8D25:", t), false;
    }
  }
  async hasSignalSentForKline(e, t, r) {
    if (!this.db) return false;
    try {
      return (await this.db.prepare(`
          SELECT COUNT(*) as count 
          FROM signal_send_log 
          WHERE symbol = ? AND kline_time = ? AND signal_category = ?
        `).bind(e, t, r).first()).count > 0;
    } catch (o) {
      return console.error("\u68C0\u67E5K\u7EBF\u53D1\u9001\u8BB0\u5F55\u5931\u8D25:", o), false;
    }
  }
  async recordSignalSent(e, t, r, o) {
    if (this.db) try {
      await this.db.prepare(`
          INSERT OR REPLACE INTO signal_send_log (symbol, kline_time, signal_category, signal_id)
          VALUES (?, ?, ?, ?)
        `).bind(e, t, r, o).run();
    } catch (n) {
      console.error("\u8BB0\u5F55\u4FE1\u53F7\u53D1\u9001\u65E5\u5FD7\u5931\u8D25:", n);
    }
  }
  async getSignalsToSend() {
    if (!this.db) return [];
    try {
      const e = await this.getSignalSendConfig(), t = ge(), r = await this.db.prepare(`
          SELECT * FROM trading_signals 
          WHERE telegram_sent = 0
            AND created_at >= ?
          ORDER BY symbol, kline_time DESC, created_at DESC
        `).bind(t).all(), o = [], n = /* @__PURE__ */ new Set();
      for (const a of r.results) {
        const c = { ...a, details: JSON.parse(a.details || "{}") }, i = `trading:${c.signal_type}`;
        if (!e.get(i) || !this.isTimeInAllowedRange(c.signal_time)) continue;
        const l = `${c.symbol}:${c.kline_time}`;
        n.has(l) || await this.hasSignalSentForKline(c.symbol, c.kline_time, "trading") || (o.push(c), n.add(l));
      }
      return o;
    } catch (e) {
      return console.error("\u83B7\u53D6\u5F85\u53D1\u9001\u4FE1\u53F7\u5931\u8D25:", e), [];
    }
  }
};
var Pe = class {
  static {
    __name(this, "Pe");
  }
  constructor(e) {
    this.db = e;
  }
  async addPosition(e) {
    return { success: true, id: (await this.db.prepare(`
      INSERT INTO positions (symbol, position_type, entry_price, quantity, stop_loss, take_profit, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(e.symbol, e.positionType, e.entryPrice, e.quantity || 0, e.stopLoss || null, e.takeProfit || null, e.notes || null).run()).meta.last_row_id };
  }
  async getActivePositions() {
    return (await this.db.prepare(`
      SELECT 
        p.*,
        COUNT(DISTINCT pa.id) as alert_count
      FROM positions p
      LEFT JOIN position_alerts pa ON p.id = pa.position_id
      WHERE p.status = 'ACTIVE' 
      GROUP BY p.id
      ORDER BY p.entry_time DESC
    `).all()).results;
  }
  async enrichPositionsWithCurrentPrice(e) {
    const t = [];
    for (const r of e) {
      const o = await this.db.prepare(`
        SELECT close FROM kline_data 
        WHERE symbol = ? AND timeframe = '5m'
        ORDER BY open_time DESC 
        LIMIT 1
      `).bind(r.symbol).first();
      t.push({ ...r, current_price: (o == null ? void 0 : o.close) || null });
    }
    return t;
  }
  async getPosition(e) {
    return await this.db.prepare(`
      SELECT * FROM positions WHERE id = ?
    `).bind(e).first();
  }
  async updatePosition(e, t) {
    const r = [], o = [];
    return t.quantity !== void 0 && (r.push("quantity = ?"), o.push(t.quantity)), t.stopLoss !== void 0 && (r.push("stop_loss = ?"), o.push(t.stopLoss)), t.takeProfit !== void 0 && (r.push("take_profit = ?"), o.push(t.takeProfit)), t.notes !== void 0 && (r.push("notes = ?"), o.push(t.notes)), r.push("updated_at = CURRENT_TIMESTAMP"), o.push(e), await this.db.prepare(`
      UPDATE positions 
      SET ${r.join(", ")}
      WHERE id = ?
    `).bind(...o).run(), { success: true };
  }
  async closePosition(e, t) {
    return await this.db.prepare(`
      UPDATE positions 
      SET status = 'CLOSED', 
          closed_at = CURRENT_TIMESTAMP,
          closed_price = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(t, e).run(), { success: true };
  }
  async deletePosition(e) {
    return await this.db.prepare(`
      DELETE FROM position_alerts WHERE position_id = ?
    `).bind(e).run(), await this.db.prepare(`
      DELETE FROM positions WHERE id = ?
    `).bind(e).run(), { success: true };
  }
  async checkPositionAlerts(e) {
    const t = await this.getActivePositions(), r = [];
    for (const o of t) {
      const n = e.find((l) => l.symbol === o.symbol && l.index === 0);
      if (!n) continue;
      const a = n.sarChangePercent || 0, c = parseFloat(n.change) || 0, i = n.rsi_5min || 0;
      o.position_type === "LONG" && a > 0 && c < 0 && i > 70 && (await this.db.prepare(`
            SELECT id FROM position_alerts 
            WHERE position_id = ? 
            AND kline_time = ?
            AND alert_type = 'LONG_TOP'
          `).bind(o.id, n.time).first() || r.push({ position: o, alertType: "LONG_TOP", klineTime: n.time, currentPrice: n.close, sarChangePercent: a, changePercent: c, rsi5min: i, entryPrice: o.entry_price, profitPercent: ((n.close - o.entry_price) / o.entry_price * 100).toFixed(2) })), o.position_type === "SHORT" && a < 0 && c > 0 && i < 30 && (await this.db.prepare(`
            SELECT id FROM position_alerts 
            WHERE position_id = ? 
            AND kline_time = ?
            AND alert_type = 'SHORT_BOTTOM'
          `).bind(o.id, n.time).first() || r.push({ position: o, alertType: "SHORT_BOTTOM", klineTime: n.time, currentPrice: n.close, sarChangePercent: a, changePercent: c, rsi5min: i, entryPrice: o.entry_price, profitPercent: ((o.entry_price - n.close) / o.entry_price * 100).toFixed(2) }));
    }
    return r;
  }
  async savePositionAlert(e) {
    return { success: true, id: (await this.db.prepare(`
      INSERT INTO position_alerts (
        position_id, alert_type, kline_time, current_price, 
        sar_change_percent, change_percent, rsi_5min, telegram_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(e.position.id, e.alertType, e.klineTime, e.currentPrice, e.sarChangePercent, e.changePercent, e.rsi5min, e.telegramSent ? 1 : 0).run()).meta.last_row_id };
  }
  async getPositionAlertHistory(e) {
    return (await this.db.prepare(`
      SELECT * FROM position_alerts 
      WHERE position_id = ? 
      ORDER BY alert_time DESC
      LIMIT 50
    `).bind(e).all()).results;
  }
};
var X = class {
  static {
    __name(this, "X");
  }
  constructor(e) {
    this.db = e;
  }
  async createAccount(e) {
    return { success: true, id: (await this.db.prepare(`
      INSERT INTO simulated_accounts (account_name, initial_balance, current_balance, leverage, trading_fee_rate)
      VALUES (?, ?, ?, ?, ?)
    `).bind(e.accountName, e.initialBalance, e.initialBalance, e.leverage || 1, e.tradingFeeRate || 1e-3).run()).meta.last_row_id };
  }
  async getAllAccounts() {
    return (await this.db.prepare(`
      SELECT * FROM simulated_accounts ORDER BY created_at DESC
    `).all()).results;
  }
  async getAccount(e) {
    const t = await this.db.prepare(`
      SELECT * FROM simulated_accounts WHERE id = ?
    `).bind(e).first();
    if (!t) throw new Error("\u8D26\u6237\u4E0D\u5B58\u5728");
    const r = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as win_trades,
        SUM(CASE WHEN profit_loss < 0 THEN 1 ELSE 0 END) as lose_trades,
        SUM(profit_loss) as total_profit_loss,
        AVG(profit_loss) as avg_profit_loss
      FROM simulated_trades
      WHERE account_id = ? AND status = 'CLOSED'
    `).bind(e).first();
    return { ...t, stats: { ...r, win_rate: r.total_trades > 0 ? (r.win_trades / r.total_trades * 100).toFixed(2) : 0 } };
  }
  async updateAccountBalance(e, t) {
    return await this.db.prepare(`
      UPDATE simulated_accounts 
      SET current_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(t, e).run(), { success: true };
  }
  async updateAccountStatus(e, t) {
    return await this.db.prepare(`
      UPDATE simulated_accounts 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(t, e).run(), { success: true };
  }
  async openTrade(e) {
    const t = await this.db.prepare(`
      SELECT * FROM simulated_accounts WHERE id = ?
    `).bind(e.accountId).first();
    if (!t) throw new Error("\u8D26\u6237\u4E0D\u5B58\u5728");
    if (t.status !== "ACTIVE") throw new Error("\u8D26\u6237\u672A\u6FC0\u6D3B");
    const r = e.entryPrice * e.quantity, n = r * t.leverage * t.trading_fee_rate, a = r + n;
    if (t.current_balance < a) throw new Error(`\u4F59\u989D\u4E0D\u8DB3\uFF0C\u9700\u8981 $${a.toFixed(2)}, \u5F53\u524D\u4F59\u989D $${t.current_balance.toFixed(2)}`);
    const c = t.current_balance - a;
    return await this.updateAccountBalance(e.accountId, c), { success: true, tradeId: (await this.db.prepare(`
      INSERT INTO simulated_trades (
        account_id, strategy_id, symbol, trade_type, position_type,
        entry_price, quantity, leverage, fee, signal_source, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(e.accountId, e.strategyId || null, e.symbol, e.positionType === "LONG" ? "BUY" : "SELL", e.positionType, e.entryPrice, e.quantity, t.leverage, n, e.signalSource || null, e.notes || null).run()).meta.last_row_id, fee: n, newBalance: c };
  }
  async closeTrade(e, t) {
    const r = await this.db.prepare(`
      SELECT t.*, a.trading_fee_rate, a.current_balance
      FROM simulated_trades t
      JOIN simulated_accounts a ON t.account_id = a.id
      WHERE t.id = ?
    `).bind(e).first();
    if (!r) throw new Error("\u4EA4\u6613\u4E0D\u5B58\u5728");
    if (r.status !== "OPEN") throw new Error("\u4EA4\u6613\u5DF2\u5173\u95ED");
    const o = t * r.quantity, n = r.entry_price * r.quantity;
    let a;
    r.position_type === "LONG" ? a = (o - n) * r.leverage : a = (n - o) * r.leverage;
    const c = o * r.trading_fee_rate;
    a -= c;
    const i = a / n * 100;
    await this.db.prepare(`
      UPDATE simulated_trades 
      SET exit_price = ?, 
          profit_loss = ?,
          profit_loss_percent = ?,
          status = 'CLOSED',
          exit_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(t, a, i, e).run();
    const l = n + a - r.fee, u = r.current_balance + l;
    return await this.updateAccountBalance(r.account_id, u), { success: true, profitLoss: a, profitLossPercent: i, exitFee: c, newBalance: u };
  }
  async getOpenTrades(e) {
    return (await this.db.prepare(`
      SELECT t.*, s.strategy_name
      FROM simulated_trades t
      LEFT JOIN trading_strategies s ON t.strategy_id = s.id
      WHERE t.account_id = ? AND t.status = 'OPEN'
      ORDER BY t.entry_time DESC
    `).bind(e).all()).results;
  }
  async getTradeHistory(e, t = 100) {
    return (await this.db.prepare(`
      SELECT t.*, s.strategy_name
      FROM simulated_trades t
      LEFT JOIN trading_strategies s ON t.strategy_id = s.id
      WHERE t.account_id = ?
      ORDER BY t.entry_time DESC
      LIMIT ?
    `).bind(e, t).all()).results;
  }
  async getAllStrategies() {
    return (await this.db.prepare(`
      SELECT * FROM trading_strategies ORDER BY created_at DESC
    `).all()).results;
  }
  async getStrategy(e) {
    return await this.db.prepare(`
      SELECT * FROM trading_strategies WHERE id = ?
    `).bind(e).first();
  }
  async executeTradeBySignal(e) {
    const t = await this.getAccount(e.accountId);
    if (t.status !== "ACTIVE") return { success: false, message: "\u8D26\u6237\u672A\u6FC0\u6D3B" };
    const r = await this.db.prepare(`
      SELECT * FROM simulated_trades 
      WHERE account_id = ? AND symbol = ? AND status = 'OPEN'
      LIMIT 1
    `).bind(e.accountId, e.symbol).first();
    if ((e.signalType === "SAR_BULLISH" || e.signalType === "RSI_OVERSOLD") && (r && r.position_type === "SHORT" && await this.closeTrade(r.id, e.currentPrice), !r || r.position_type === "SHORT")) {
      const o = e.quantity || t.current_balance * 0.1 / e.currentPrice;
      return await this.openTrade({ accountId: e.accountId, strategyId: e.strategyId, symbol: e.symbol, positionType: "LONG", entryPrice: e.currentPrice, quantity: o, signalSource: e.signalType, notes: "\u81EA\u52A8\u4EA4\u6613\uFF1A\u770B\u591A\u4FE1\u53F7" });
    }
    if ((e.signalType === "SAR_BEARISH" || e.signalType === "RSI_OVERBOUGHT") && (r && r.position_type === "LONG" && await this.closeTrade(r.id, e.currentPrice), !r || r.position_type === "LONG")) {
      const o = e.quantity || t.current_balance * 0.1 / e.currentPrice;
      return await this.openTrade({ accountId: e.accountId, strategyId: e.strategyId, symbol: e.symbol, positionType: "SHORT", entryPrice: e.currentPrice, quantity: o, signalSource: e.signalType, notes: "\u81EA\u52A8\u4EA4\u6613\uFF1A\u770B\u7A7A\u4FE1\u53F7" });
    }
    return { success: true, message: "\u65E0\u9700\u4EA4\u6613" };
  }
  async autoTradeAllSymbols(e, t) {
    if ((await this.getAccount(e)).status !== "ACTIVE") return { success: false, message: "\u8D26\u6237\u672A\u6FC0\u6D3B" };
    const o = await this.db.prepare(`
      SELECT symbol, signal, close 
      FROM kline_data 
      WHERE timeframe = '5m' 
      AND signal IS NOT NULL
      GROUP BY symbol
      HAVING MAX(open_time)
    `).all(), n = [];
    for (const a of o.results) {
      let c = "";
      if (a.signal && a.signal.includes("\u591A\u5934") ? c = "SAR_BULLISH" : a.signal && a.signal.includes("\u7A7A\u5934") && (c = "SAR_BEARISH"), c) {
        const i = await this.executeTradeBySignal({ accountId: e, strategyId: t, symbol: a.symbol, signalType: c, currentPrice: a.close });
        n.push({ symbol: a.symbol, signal: a.signal, result: i });
      }
    }
    return { success: true, trades: n };
  }
  async createAccountSnapshot(e) {
    const t = await this.getAccount(e);
    return await this.db.prepare(`
      INSERT INTO account_snapshots (
        account_id, balance, total_profit_loss, total_trades,
        win_trades, lose_trades, win_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(e, t.current_balance, t.stats.total_profit_loss || 0, t.stats.total_trades || 0, t.stats.win_trades || 0, t.stats.lose_trades || 0, parseFloat(t.stats.win_rate) || 0).run(), { success: true };
  }
};
var et = class {
  static {
    __name(this, "et");
  }
  constructor(e) {
    E(this, "db");
    this.db = e;
  }
  async analyzeSurgePatterns(e, t = "5m") {
    console.log(`\u{1F4C8} \u5F00\u59CB\u5206\u6790 ${e} \u7684\u8D77\u6DA8\u6A21\u5F0F...`);
    const o = (await this.db.prepare(`
        SELECT open_time, open, high, low, close, volume, volume_v1, volume_v2
        FROM kline_data
        WHERE symbol = ? AND timeframe = ?
        ORDER BY open_time ASC
        LIMIT 600
      `).bind(e, t).all()).results;
    if (o.length < 10) return console.log(`  \u26A0\uFE0F  ${e} K\u7EBF\u6570\u636E\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7`), [];
    const n = [];
    for (let a = 0; a <= o.length - 10; a++) {
      const c = o.slice(a, a + 10), i = c[0].open, u = (c[9].close - i) / i * 100;
      if (u >= 2) {
        const d = this.extractSurgeFeatures(c);
        n.push({ symbol: e, start_time: c[0].open_time, end_time: c[9].open_time, total_change: u, kline_count: 10, features: d });
      }
    }
    return console.log(`  \u2705 ${e} \u627E\u5230 ${n.length} \u4E2A\u8D77\u6DA8\u6A21\u5F0F`), n;
  }
  async analyzeCrashPatterns(e, t = "5m") {
    console.log(`\u{1F4C9} \u5F00\u59CB\u5206\u6790 ${e} \u7684\u8D77\u8DCC\u6A21\u5F0F...`);
    const o = (await this.db.prepare(`
        SELECT open_time, open, high, low, close, volume, volume_v1, volume_v2
        FROM kline_data
        WHERE symbol = ? AND timeframe = ?
        ORDER BY open_time ASC
        LIMIT 600
      `).bind(e, t).all()).results;
    if (o.length < 10) return console.log(`  \u26A0\uFE0F  ${e} K\u7EBF\u6570\u636E\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7`), [];
    const n = [];
    for (let a = 0; a <= o.length - 10; a++) {
      const c = o.slice(a, a + 10), i = c[0].open, u = (c[9].close - i) / i * 100;
      if (u <= -3) {
        const d = this.extractCrashFeatures(c);
        n.push({ symbol: e, start_time: c[0].open_time, end_time: c[9].open_time, total_change: u, kline_count: 10, features: d });
      }
    }
    return console.log(`  \u2705 ${e} \u627E\u5230 ${n.length} \u4E2A\u8D77\u8DCC\u6A21\u5F0F`), n;
  }
  extractSurgeFeatures(e) {
    const t = e.filter((f) => f.volume_v1 === 1).length, r = e.filter((f) => f.volume_v2 === 1).length, o = t > 0, n = e.reduce((f, R) => f + R.volume, 0) / e.length, c = Math.max(...e.map((f) => f.volume)) / n, i = e.filter((f) => f.close > f.open).length, l = e.filter((f) => f.close < f.open).length, u = this.countContinuous(e, "green"), d = e.map((f, R) => R === 0 ? 0 : (f.close - e[R - 1].close) / e[R - 1].close * 100), g = Math.max(...d), y = d.reduce((f, R) => f + R, 0) / d.length, p = e[0].open, b = (Math.max(...e.map((f) => f.high)) - p) / p * 100, w = e.slice(0, 3), S = w.some((f) => f.volume_v1 === 1 || f.volume_v2 === 1), T = w.filter((f) => f.close > f.open).length, v = (w[2].close - w[0].open) / w[0].open * 100;
    return { volume_v1_count: t, volume_v2_count: r, has_volume_v1: o, volume_surge_ratio: c.toFixed(2), green_count: i, red_count: l, continuous_green: u, max_single_change: g.toFixed(2), avg_change: y.toFixed(2), breakout_percent: b.toFixed(2), early_volume_surge: S, early_green_count: T, early_change: v.toFixed(2) };
  }
  extractCrashFeatures(e) {
    const t = e.filter((f) => f.volume_v1 === 1).length, r = e.filter((f) => f.volume_v2 === 1).length, o = t > 0, n = e.reduce((f, R) => f + R.volume, 0) / e.length, c = Math.max(...e.map((f) => f.volume)) / n, i = e.filter((f) => f.close > f.open).length, l = e.filter((f) => f.close < f.open).length, u = this.countContinuous(e, "red"), d = e.map((f, R) => R === 0 ? 0 : (f.close - e[R - 1].close) / e[R - 1].close * 100), g = Math.min(...d), y = d.reduce((f, R) => f + R, 0) / d.length, p = e[0].open, b = (Math.min(...e.map((f) => f.low)) - p) / p * 100, w = e.slice(0, 3), S = w.some((f) => f.volume_v1 === 1 || f.volume_v2 === 1), T = w.filter((f) => f.close < f.open).length, v = (w[2].close - w[0].open) / w[0].open * 100;
    return { volume_v1_count: t, volume_v2_count: r, has_volume_v1: o, volume_surge_ratio: c.toFixed(2), green_count: i, red_count: l, continuous_red: u, min_single_change: g.toFixed(2), avg_change: y.toFixed(2), crash_percent: b.toFixed(2), early_volume_surge: S, early_red_count: T, early_change: v.toFixed(2) };
  }
  countContinuous(e, t) {
    let r = 0, o = 0;
    for (const n of e) (t === "green" ? n.close > n.open : n.close < n.open) ? (o++, r = Math.max(r, o)) : o = 0;
    return r;
  }
  async savePattern(e, t) {
    const r = JSON.stringify(t.features), o = t.features.volume_v1_count > 0 ? 1 : 0, n = e === "surge" ? parseFloat(t.features.breakout_percent) > 3 : parseFloat(t.features.crash_percent) < -4, a = e === "surge" ? t.features.continuous_green >= 5 : t.features.continuous_red >= 5;
    await this.db.prepare(`
        INSERT OR REPLACE INTO pattern_features (
          pattern_type, symbol, start_time, end_time, total_change, kline_count,
          features, volume_surge, price_breakout, continuous_direction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(e, t.symbol, t.start_time, t.end_time, t.total_change, t.kline_count, r, o, n ? 1 : 0, a ? 1 : 0).run();
  }
  async getSurgePatterns(e = 100) {
    return (await this.db.prepare(`
        SELECT * FROM pattern_features
        WHERE pattern_type = 'surge'
        ORDER BY start_time DESC
        LIMIT ?
      `).bind(e).all()).results.map((r) => ({ ...r, features: JSON.parse(r.features) }));
  }
  async getCrashPatterns(e = 100) {
    return (await this.db.prepare(`
        SELECT * FROM pattern_features
        WHERE pattern_type = 'crash'
        ORDER BY start_time DESC
        LIMIT ?
      `).bind(e).all()).results.map((r) => ({ ...r, features: JSON.parse(r.features) }));
  }
  async getPatternStats() {
    const e = await this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          AVG(total_change) as avg_change,
          SUM(volume_surge) as volume_surge_count,
          SUM(price_breakout) as breakout_count,
          SUM(continuous_direction) as continuous_count
        FROM pattern_features
        WHERE pattern_type = 'surge'
      `).first(), t = await this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          AVG(total_change) as avg_change,
          SUM(volume_surge) as volume_surge_count,
          SUM(price_breakout) as breakout_count,
          SUM(continuous_direction) as continuous_count
        FROM pattern_features
        WHERE pattern_type = 'crash'
      `).first();
    return { surge: e, crash: t };
  }
};
var Ue = class {
  static {
    __name(this, "Ue");
  }
  constructor(e) {
    E(this, "db");
    this.db = e;
  }
  async getAllSettings() {
    return (await this.db.prepare("SELECT * FROM system_settings ORDER BY category, id").all()).results;
  }
  async getSettingsByCategory(e) {
    return (await this.db.prepare("SELECT * FROM system_settings WHERE category = ? ORDER BY id").bind(e).all()).results;
  }
  async getSetting(e) {
    const t = await this.db.prepare("SELECT setting_value FROM system_settings WHERE setting_key = ?").bind(e).first();
    return (t == null ? void 0 : t.setting_value) || null;
  }
  async getNumberSetting(e, t = 0) {
    const r = await this.getSetting(e);
    return r ? parseFloat(r) : t;
  }
  async updateSetting(e, t) {
    await this.db.prepare(`
        UPDATE system_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `).bind(t, e).run();
  }
  async updateSettings(e) {
    const t = e.map((r) => this.db.prepare(`
          UPDATE system_settings 
          SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = ?
        `).bind(r.value, r.key));
    await this.db.batch(t);
  }
  async getSettingsMap() {
    const e = await this.getAllSettings(), t = {};
    return e.forEach((r) => {
      t[r.setting_key] = r.setting_value;
    }), t;
  }
  async resetToDefaults() {
    await this.db.prepare("DELETE FROM system_settings").run();
    const t = [{ key: "extreme_up_threshold", value: "4", type: "number", name: "\u6781\u7AEF\u4E0A\u6DA8\u9608\u503C(%)", desc: "\u5355\u8F6E\u6DA8\u5E45\u8FBE\u5230\u6B64\u503C\u7B97\u6781\u7AEF\u4E0A\u6DA8", category: "extremes" }, { key: "extreme_down_threshold", value: "-3", type: "number", name: "\u6781\u7AEF\u4E0B\u8DCC\u9608\u503C(%)", desc: "\u5355\u8F6E\u8DCC\u5E45\u8FBE\u5230\u6B64\u503C\u7B97\u6781\u7AEF\u4E0B\u8DCC", category: "extremes" }, { key: "surge_threshold", value: "1", type: "number", name: "\u6025\u6DA8\u9608\u503C(%)", desc: "\u76F8\u5BF9\u4E0A\u4E00\u8F6E\u6DA8\u5E45\u8FBE\u5230\u6B64\u503C\u7B97\u6025\u6DA8", category: "surge_crash" }, { key: "crash_threshold", value: "-1", type: "number", name: "\u6025\u8DCC\u9608\u503C(%)", desc: "\u76F8\u5BF9\u4E0A\u4E00\u8F6E\u8DCC\u5E45\u8FBE\u5230\u6B64\u503C\u7B97\u6025\u8DCC", category: "surge_crash" }, { key: "risk_alert_green_ratio", value: "0", type: "number", name: "\u5168\u7EFF\u98CE\u9669\u6BD4\u4F8B(%)", desc: "\u7EFF\u8272\u5360\u6BD4\u8FBE\u5230\u6B64\u503C\u89E6\u53D1\u98CE\u9669\u63D0\u793A", category: "risk" }, { key: "new_high_reset_threshold", value: "3", type: "number", name: "\u521B\u65B0\u9AD8\u91CD\u7F6E\u9608\u503C", desc: "\u8FDE\u7EEDN\u6B21\u672A\u521B\u65B0\u9AD8\u5219\u91CD\u7F6E\u8BA1\u6570", category: "extremes" }, { key: "new_low_reset_threshold", value: "3", type: "number", name: "\u521B\u65B0\u4F4E\u91CD\u7F6E\u9608\u503C", desc: "\u8FDE\u7EEDN\u6B21\u672A\u521B\u65B0\u4F4E\u5219\u91CD\u7F6E\u8BA1\u6570", category: "extremes" }, { key: "rsi_period", value: "14", type: "number", name: "RSI\u5468\u671F", desc: "RSI\u6307\u6807\u8BA1\u7B97\u5468\u671F", category: "indicators" }, { key: "boll_period", value: "20", type: "number", name: "BOLL\u5468\u671F", desc: "\u5E03\u6797\u5E26\u8BA1\u7B97\u5468\u671F", category: "indicators" }, { key: "boll_k", value: "2", type: "number", name: "BOLL\u6807\u51C6\u5DEE\u500D\u6570", desc: "\u5E03\u6797\u5E26\u4E0A\u4E0B\u8F68\u6807\u51C6\u5DEE\u500D\u6570", category: "indicators" }, { key: "sar_af", value: "0.02", type: "number", name: "SAR\u52A0\u901F\u56E0\u5B50", desc: "SAR\u6307\u6807\u521D\u59CB\u52A0\u901F\u56E0\u5B50", category: "indicators" }, { key: "sar_max_af", value: "0.2", type: "number", name: "SAR\u6700\u5927\u52A0\u901F\u56E0\u5B50", desc: "SAR\u6307\u6807\u6700\u5927\u52A0\u901F\u56E0\u5B50", category: "indicators" }, { key: "analysis_interval", value: "300000", type: "number", name: "\u5206\u6790\u95F4\u9694(\u6BEB\u79D2)", desc: "\u81EA\u52A8\u4EF7\u683C\u5206\u6790\u7684\u65F6\u95F4\u95F4\u9694", category: "general" }, { key: "kline_sync_interval", value: "900000", type: "number", name: "K\u7EBF\u540C\u6B65\u95F4\u9694(\u6BEB\u79D2)", desc: "K\u7EBF\u6570\u636E\u540C\u6B65\u7684\u65F6\u95F4\u95F4\u9694", category: "general" }].map((r) => this.db.prepare(`
          INSERT INTO system_settings (setting_key, setting_value, setting_type, display_name, description, category)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(r.key, r.value, r.type, r.name, r.desc, r.category));
    await this.db.batch(t);
  }
};
var W = class {
  static {
    __name(this, "W");
  }
  constructor(e) {
    this.db = e;
  }
  async getAllRules() {
    return (await this.db.prepare(`
        SELECT * FROM trading_rules 
        ORDER BY symbol ASC
      `).all()).results;
  }
  async getRuleBySymbol(e) {
    return await this.db.prepare(`
        SELECT * FROM trading_rules 
        WHERE symbol = ?
      `).bind(e).first();
  }
  async isTradingAllowed(e) {
    const t = await this.getRuleBySymbol(e);
    return t ? t.trading_allowed === 1 : false;
  }
  async isLongAllowed(e) {
    const t = await this.getRuleBySymbol(e);
    return !t || t.trading_allowed !== 1 ? false : t.long_allowed === 1;
  }
  async isShortAllowed(e) {
    const t = await this.getRuleBySymbol(e);
    return !t || t.trading_allowed !== 1 ? false : t.short_allowed === 1;
  }
  async updateRule(e) {
    const { symbol: t, trading_allowed: r, long_allowed: o, short_allowed: n, notes: a } = e, c = [], i = [];
    if (r !== void 0 && (c.push("trading_allowed = ?"), i.push(r)), o !== void 0 && (c.push("long_allowed = ?"), i.push(o)), n !== void 0 && (c.push("short_allowed = ?"), i.push(n)), a !== void 0 && (c.push("notes = ?"), i.push(a)), c.length === 0) return;
    c.push("updated_at = CURRENT_TIMESTAMP"), i.push(t);
    const l = `
      UPDATE trading_rules 
      SET ${c.join(", ")}
      WHERE symbol = ?
    `;
    await this.db.prepare(l).bind(...i).run();
  }
  async batchUpdateRules(e) {
    for (const t of e) await this.updateRule(t);
  }
  async getTradingStats() {
    return await this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN trading_allowed = 1 THEN 1 ELSE 0 END) as trading_allowed,
          SUM(CASE WHEN trading_allowed = 1 AND long_allowed = 1 THEN 1 ELSE 0 END) as long_allowed,
          SUM(CASE WHEN trading_allowed = 1 AND short_allowed = 1 THEN 1 ELSE 0 END) as short_allowed,
          SUM(CASE WHEN trading_allowed = 1 AND long_allowed = 1 AND short_allowed = 1 THEN 1 ELSE 0 END) as both_allowed,
          SUM(CASE WHEN trading_allowed = 0 THEN 1 ELSE 0 END) as trading_disabled
        FROM trading_rules
      `).first();
  }
  async resetAllRules() {
    await this.db.prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 1, 
            long_allowed = 1, 
            short_allowed = 1,
            notes = '\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u5141\u8BB8\u6240\u6709\u4EA4\u6613',
            updated_at = CURRENT_TIMESTAMP
      `).run();
  }
  async disableAllTrading() {
    await this.db.prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 0,
            notes = '\u5168\u90E8\u7981\u6B62\u4EA4\u6613',
            updated_at = CURRENT_TIMESTAMP
      `).run();
  }
  async setLongOnly() {
    await this.db.prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 1,
            long_allowed = 1,
            short_allowed = 0,
            notes = '\u4EC5\u5141\u8BB8\u505A\u591A',
            updated_at = CURRENT_TIMESTAMP
      `).run();
  }
  async setShortOnly() {
    await this.db.prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 1,
            long_allowed = 0,
            short_allowed = 1,
            notes = '\u4EC5\u5141\u8BB8\u505A\u7A7A',
            updated_at = CURRENT_TIMESTAMP
      `).run();
  }
  async applyRiskBasedRules(e) {
    let t = [], r = "";
    if (e === "\u9AD8\u98CE\u9669") t = [1, 2], r = "\u9AD8\u98CE\u9669\u6A21\u5F0F\uFF1A\u4EC5\u5141\u8BB81-2\u7B49\u7EA7\u5E01\u79CD\u4EA4\u6613";
    else if (e === "\u4E2D\u98CE\u9669") t = [1, 2, 3, 4], r = "\u4E2D\u98CE\u9669\u6A21\u5F0F\uFF1A\u5141\u8BB81-4\u7B49\u7EA7\u5E01\u79CD\u4EA4\u6613";
    else {
      await this.db.prepare(`
          UPDATE trading_rules 
          SET trading_allowed = 1,
              notes = '\u4F4E\u98CE\u9669\u6A21\u5F0F\uFF1A\u5141\u8BB8\u6240\u6709\u7B49\u7EA7\u5E01\u79CD\u4EA4\u6613',
              updated_at = CURRENT_TIMESTAMP
        `).run();
      return;
    }
    const n = (await this.db.prepare(`
        SELECT symbol FROM coin_priority 
        WHERE level IN (${t.join(",")})
      `).all()).results.map((a) => a.symbol);
    if (await this.db.prepare(`
        UPDATE trading_rules 
        SET trading_allowed = 0,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
      `).bind(r).run(), n.length > 0) {
      const a = n.map(() => "?").join(",");
      await this.db.prepare(`
          UPDATE trading_rules 
          SET trading_allowed = 1,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE symbol IN (${a})
        `).bind(r, ...n).run();
    }
  }
  async getAllowedCoinsByRisk(e) {
    let t = [];
    if (e === "\u9AD8\u98CE\u9669") t = [1, 2];
    else if (e === "\u4E2D\u98CE\u9669") t = [1, 2, 3, 4];
    else return (await this.db.prepare("SELECT symbol FROM coins ORDER BY symbol").all()).results.map((n) => n.symbol);
    return (await this.db.prepare(`
        SELECT symbol FROM coin_priority 
        WHERE level IN (${t.join(",")})
        ORDER BY level, symbol
      `).all()).results.map((o) => o.symbol);
  }
  async applyUnilateralStrategy(e, t) {
    let r = "", o = true, n = true, a = "";
    return e > 0 && t === 0 ? (r = "\u5355\u8FB9\u4E3B\u5347", o = true, n = false, a = "\u5355\u8FB9\u4E3B\u5347\u5E02\u573A\uFF1A\u7981\u6B62\u505A\u7A7A", await this.db.prepare(`
          UPDATE trading_rules 
          SET long_allowed = 1,
              short_allowed = 0,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE trading_allowed = 1
        `).bind(a).run()) : t > 0 && e === 0 ? (r = "\u5355\u8FB9\u4E3B\u8DCC", o = false, n = true, a = "\u5355\u8FB9\u4E3B\u8DCC\u5E02\u573A\uFF1A\u7981\u6B62\u505A\u591A", await this.db.prepare(`
          UPDATE trading_rules 
          SET long_allowed = 0,
              short_allowed = 1,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE trading_allowed = 1
        `).bind(a).run()) : (r = "\u53CC\u8FB9\u9707\u8361", o = true, n = true, a = "\u53CC\u8FB9\u9707\u8361\u5E02\u573A\uFF1A\u5141\u8BB8\u505A\u591A\u505A\u7A7A", await this.db.prepare(`
          UPDATE trading_rules 
          SET long_allowed = 1,
              short_allowed = 1,
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE trading_allowed = 1
        `).bind(a).run()), { strategy: r, long_allowed: o, short_allowed: n };
  }
  async getTodayMarketStats() {
    const e = /* @__PURE__ */ new Date();
    e.setHours(e.getHours() + 8);
    const t = e.toISOString().split("T")[0], r = await this.db.prepare(`
        SELECT 
          SUM(total_surges) as total_surges,
          SUM(total_crashes) as total_crashes
        FROM daily_stats
        WHERE date = ?
      `).bind(t).first();
    return { todaySurgeCount: (r == null ? void 0 : r.total_surges) || 0, todayCrashCount: (r == null ? void 0 : r.total_crashes) || 0 };
  }
};
var be = class {
  static {
    __name(this, "be");
  }
  constructor(e) {
    this.db = e;
  }
  getTodayDate() {
    const e = /* @__PURE__ */ new Date();
    return e.setHours(e.getHours() + 8), e.toISOString().split("T")[0];
  }
  async setSupportLine(e, t, r) {
    const o = this.getTodayDate();
    await this.db.prepare(`
        INSERT INTO support_lines (symbol, support_price, date, notes)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol, date) DO UPDATE SET
          support_price = excluded.support_price,
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `).bind(e, t, o, r || "").run();
  }
  async batchSetSupportLines(e) {
    const t = this.getTodayDate(), r = e.map((o) => this.db.prepare(`
          INSERT INTO support_lines (symbol, support_price, date, notes)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(symbol, date) DO UPDATE SET
            support_price = excluded.support_price,
            notes = excluded.notes,
            updated_at = CURRENT_TIMESTAMP
        `).bind(o.symbol, o.support_price, t, o.notes || ""));
    await this.db.batch(r);
  }
  async getTodaySupportLines() {
    const e = this.getTodayDate();
    return (await this.db.prepare(`
        SELECT * FROM support_lines
        WHERE date = ?
        ORDER BY symbol
      `).bind(e).all()).results;
  }
  async getSupportLine(e) {
    const t = this.getTodayDate();
    return await this.db.prepare(`
        SELECT * FROM support_lines
        WHERE symbol = ? AND date = ?
      `).bind(e, t).first();
  }
  async deleteSupportLine(e) {
    const t = this.getTodayDate();
    await this.db.prepare(`
        DELETE FROM support_lines
        WHERE symbol = ? AND date = ?
      `).bind(e, t).run();
  }
  async clearTodaySupportLines() {
    var r;
    const e = this.getTodayDate();
    return ((r = (await this.db.prepare(`
        DELETE FROM support_lines
        WHERE date = ?
      `).bind(e).run()).meta) == null ? void 0 : r.changes) || 0;
  }
  async cleanupOldSupportLines() {
    var t;
    return ((t = (await this.db.prepare(`
        DELETE FROM support_lines
        WHERE date < date('now', '-7 days', '+8 hours')
      `).run()).meta) == null ? void 0 : t.changes) || 0;
  }
  async checkOpportunities() {
    const e = this.getTodayDate(), r = await this.db.prepare(`
      SELECT 
        sl.symbol,
        sl.support_price,
        sl.date,
        cp.level as coin_level,
        tr.long_allowed,
        tr.notes as market_notes
      FROM support_lines sl
      INNER JOIN coin_priority cp ON sl.symbol = cp.symbol
      INNER JOIN trading_rules tr ON sl.symbol = tr.symbol
      WHERE sl.date = ?
        AND cp.level <= 2
        AND tr.trading_allowed = 1
        AND tr.long_allowed = 1
      ORDER BY cp.level, sl.symbol
    `).bind(e).all(), o = [];
    for (const n of r.results) {
      const a = await this.db.prepare(`
          SELECT price 
          FROM coin_round_details 
          WHERE symbol = ?
          ORDER BY round_time DESC 
          LIMIT 1
        `).bind(n.symbol).first();
      if (!a) continue;
      const c = a.price, i = n.support_price, l = (c - i) / i * 100, u = Math.abs(l) <= 1, d = n.market_notes || "", g = d.includes("\u5355\u8FB9\u4E3B\u8DCC") ? "\u5355\u8FB9\u4E3B\u8DCC" : d.includes("\u5355\u8FB9\u4E3B\u5347") ? "\u5355\u8FB9\u4E3B\u5347" : "\u53CC\u8FB9\u9707\u8361", y = g !== "\u5355\u8FB9\u4E3B\u8DCC" && n.long_allowed === 1;
      o.push({ symbol: n.symbol, current_price: c, support_price: i, distance_percent: l, is_near_support: u, coin_level: n.coin_level, market_strategy: g, can_long: y });
    }
    return o;
  }
  async getOpportunitySummary() {
    const e = await this.checkOpportunities(), t = e.filter((r) => r.is_near_support && r.can_long);
    return { total_opportunities: e.length, near_support_count: t.length, opportunities: t };
  }
};
var qe = class {
  static {
    __name(this, "qe");
  }
  constructor(e) {
    E(this, "db");
    this.db = e;
  }
  async analyzeHistoricalData(e = "5m", t = 300) {
    try {
      console.log(`\u5F00\u59CB\u5206\u6790\u4ECA\u5929\u7684K\u7EBF\u6570\u636E (timeframe: ${e}, limit: ${t})...`), await this.db.prepare("DELETE FROM consecutive_rise_dominance").run();
      const o = (await this.db.prepare("SELECT DISTINCT symbol FROM kline_data WHERE timeframe = ? ORDER BY symbol").bind(e).all()).results.map((a) => a.symbol);
      console.log(`\u627E\u5230 ${o.length} \u4E2A\u5E01\u79CD`);
      let n = 0;
      for (const a of o) try {
        await this.analyzeSymbolKlines(a, e, t), n++, n % 5 === 0 && console.log(`\u5DF2\u5904\u7406 ${n}/${o.length} \u4E2A\u5E01\u79CD...`);
      } catch (c) {
        console.error(`\u5904\u7406 ${a} \u5931\u8D25:`, c.message);
      }
      return console.log(`\u4ECA\u5929\u6570\u636E\u5206\u6790\u5B8C\u6210\uFF0C\u5171\u5904\u7406 ${n} \u4E2A\u5E01\u79CD`), { success: true, processedSymbols: n, totalSymbols: o.length, timeframe: e, message: "\u5386\u53F2\u6570\u636E\u5206\u6790\u5B8C\u6210" };
    } catch (r) {
      throw console.error("\u5206\u6790\u5386\u53F2\u6570\u636E\u5931\u8D25:", r), r;
    }
  }
  async analyzeSymbolKlines(e, t, r) {
    const n = await new B(this.db).getKlineWithIndicators(e, t, r);
    if (!n || !n.data || n.data.length === 0) return;
    const a = /* @__PURE__ */ new Date(), c = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    c.setHours(c.getHours() - 8), c.toISOString();
    let i = n.data.reverse();
    if (i = i.filter((_) => /* @__PURE__ */ new Date(_.time.replace(/\//g, "-").replace(" ", "T") + "Z") >= c), i.length === 0) return;
    let l = 0, u = 0, d = null, g = null, y = 0, p = 0;
    for (const _ of i) {
      const b = _.up_channel_exhaustion_ratio || 0, w = _.down_channel_exhaustion_ratio || 0, S = _.time;
      if (y = b, p = w, b > w) {
        if (l === 0 ? l = 1 : l++, l > u) {
          u = l, g = S;
          const f = i.findIndex((R) => R.time === S) - l + 1;
          f >= 0 ? d = i[f].time : d = S;
        }
      } else l = 0;
    }
    await this.db.prepare(`
        INSERT INTO consecutive_rise_dominance (
          symbol, current_streak, max_streak, 
          max_streak_start_time, max_streak_end_time,
          last_check_time, last_high_ratio, last_low_ratio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(e, l, u, d, g, (/* @__PURE__ */ new Date()).toISOString(), y, p).run();
  }
  async updateSymbolKline(e, t = "5m") {
    try {
      const o = await new B(this.db).getKlineWithIndicators(e, t, 1);
      if (!o || !o.data || o.data.length === 0) return;
      const n = o.data[0], a = n.up_channel_exhaustion_ratio || 0, c = n.down_channel_exhaustion_ratio || 0, i = n.time, l = a > c, u = await this.db.prepare("SELECT * FROM consecutive_rise_dominance WHERE symbol = ?").bind(e).first();
      if (!u) await this.db.prepare(`
            INSERT INTO consecutive_rise_dominance (
              symbol, current_streak, max_streak,
              max_streak_start_time, max_streak_end_time,
              last_check_time, last_high_ratio, last_low_ratio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(e, l ? 1 : 0, l ? 1 : 0, l ? i : null, l ? i : null, i, a, c).run();
      else {
        const d = u.current_streak, g = u.max_streak;
        let y, p = g, _ = u.max_streak_start_time, b = u.max_streak_end_time;
        l ? (y = d + 1, y > g && (p = y, b = i, d === 0 && (_ = i))) : y = 0, await this.db.prepare(`
            UPDATE consecutive_rise_dominance
            SET 
              current_streak = ?,
              max_streak = ?,
              max_streak_start_time = ?,
              max_streak_end_time = ?,
              last_check_time = ?,
              last_high_ratio = ?,
              last_low_ratio = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE symbol = ?
          `).bind(y, p, _, b, i, a, c, e).run();
      }
    } catch (r) {
      throw console.error(`\u66F4\u65B0 ${e} K\u7EBF\u7EDF\u8BA1\u5931\u8D25:`, r), r;
    }
  }
  async getCoinsAboveThreshold(e = 20) {
    try {
      return (await this.db.prepare(`
          SELECT 
            crd.*,
            pe.all_time_high,
            pe.all_time_low
          FROM consecutive_rise_dominance crd
          LEFT JOIN price_extremes pe ON crd.symbol = pe.symbol
          WHERE crd.max_streak >= ?
          ORDER BY crd.max_streak DESC, crd.current_streak DESC
        `).bind(e).all()).results;
    } catch (t) {
      throw console.error("\u83B7\u53D6\u8FDE\u7EED\u7EDF\u8BA1\u5931\u8D25:", t), t;
    }
  }
  async getAllStats() {
    try {
      return (await this.db.prepare(`
          SELECT 
            crd.*,
            pe.all_time_high,
            pe.all_time_low
          FROM consecutive_rise_dominance crd
          LEFT JOIN price_extremes pe ON crd.symbol = pe.symbol
          ORDER BY crd.max_streak DESC, crd.current_streak DESC
        `).all()).results;
    } catch (e) {
      throw console.error("\u83B7\u53D6\u6240\u6709\u8FDE\u7EED\u7EDF\u8BA1\u5931\u8D25:", e), e;
    }
  }
  async getStatsOverview() {
    try {
      return await this.db.prepare(`
          SELECT 
            COUNT(*) as total_coins,
            COUNT(CASE WHEN max_streak >= 20 THEN 1 END) as above_20,
            COUNT(CASE WHEN max_streak >= 30 THEN 1 END) as above_30,
            COUNT(CASE WHEN max_streak >= 40 THEN 1 END) as above_40,
            COUNT(CASE WHEN current_streak > 0 THEN 1 END) as currently_rising,
            MAX(max_streak) as max_streak_overall,
            AVG(max_streak) as avg_max_streak
          FROM consecutive_rise_dominance
        `).first();
    } catch (e) {
      throw console.error("\u83B7\u53D6\u7EDF\u8BA1\u6982\u89C8\u5931\u8D25:", e), e;
    }
  }
};
var m = new Vt();
m.use("/api/*", ks());
m.use("/static/*", Gt({ root: "./public" }));
m.use("/*.html", Gt({ root: "./public" }));
m.post("/api/analyze", async (s) => {
  const e = new H(s.env.DB), r = await new ut(e).performRoundAnalysis();
  return s.json(r);
});
m.get("/api/dashboard", async (s) => {
  const e = new H(s.env.DB), r = await new ut(e).getDashboardData();
  return s.json(r);
});
m.get("/api/coins", async (s) => {
  const t = await new H(s.env.DB).getAllCoins();
  return s.json(t);
});
m.get("/api/rounds", async (s) => {
  const e = parseInt(s.req.query("limit") || "50"), r = await new H(s.env.DB).getLatestRoundStats(e);
  return s.json(r);
});
m.get("/api/history", async (s) => {
  const e = s.req.query("round_time"), t = parseInt(s.req.query("limit") || "20");
  try {
    const r = new H(s.env.DB), o = new ut(r);
    if (e) {
      const n = await o.getDashboardDataByRound(e);
      return s.json(n);
    } else {
      const n = await r.getLatestRoundStats(t);
      return s.json({ rounds: n });
    }
  } catch (r) {
    return s.json({ success: false, error: r.message }, 500);
  }
});
m.get("/api/debug/time", async (s) => {
  const { debugTimeInfo: e, getBeijingDateString: t, getBeijingTodayStart: r, getBeijingYesterday: o, getBeijingDateTimeString: n } = await Promise.resolve().then(() => Js);
  return s.json({ utc: { now: (/* @__PURE__ */ new Date()).toISOString(), date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] }, beijing: { now: n(), date: t(), todayStart: r(), yesterday: o() }, explanation: "\u6240\u6709\u6570\u636E\u6E05\u96F6\u548C\u7EDF\u8BA1\u90FD\u57FA\u4E8E\u5317\u4EAC\u65F6\u95F4\uFF08UTC+8\uFF09\uFF0C0\u70B9\u4E3A\u5317\u4EAC\u65F6\u95F40\u70B9" });
});
m.post("/api/debug/reset", async (s) => {
  try {
    return await new H(s.env.DB).resetAllDailyData(), s.json({ success: true, message: "\u6BCF\u65E5\u6570\u636E\u6E05\u96F6\u5B8C\u6210\uFF08\u624B\u52A8\u89E6\u53D1\uFF09" });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/compare", async (s) => {
  var e;
  try {
    const t = new H(s.env.DB), r = await t.getAllPriceExtremes(), n = (await t.getLatestRoundStats(1))[0];
    if (!n) return s.json({ success: false, error: "\u6682\u65E0\u6570\u636E" }, 404);
    const a = await t.getLatestCoinDetails(n.round_time), c = r.map((i) => {
      const l = a.find((y) => y.symbol === i.symbol), u = l ? l.price : 0, d = i.all_time_high > 0 ? u / i.all_time_high * 100 : 0, g = i.all_time_low > 0 ? u / i.all_time_low * 100 : 0;
      return { symbol: i.symbol, highPrice: i.all_time_high, highCount: i.high_count, lowPrice: i.all_time_low, lowCount: i.low_count, currentPrice: u, highRatio: d, lowRatio: g, ath_date: i.ath_date, atl_date: i.atl_date, last_updated: i.last_updated };
    });
    return s.json({ success: true, updateTime: n.round_time, lastUpdated: ((e = r[0]) == null ? void 0 : e.last_updated) || (/* @__PURE__ */ new Date()).toISOString(), coins: c });
  } catch (t) {
    return s.json({ success: false, error: t.message }, 500);
  }
});
m.get("/api/compare/summary", async (s) => {
  try {
    const e = new H(s.env.DB), t = await e.getAllPriceExtremes(), o = (await e.getLatestRoundStats(1))[0];
    if (!o) return s.json({ success: false, error: "\u6682\u65E0\u6570\u636E" }, 404);
    const n = await e.getLatestCoinDetails(o.round_time), a = t.map((c) => {
      const i = n.find((g) => g.symbol === c.symbol), l = i ? i.price : 0, u = c.all_time_high > 0 ? l / c.all_time_high * 100 : 0, d = c.all_time_low > 0 ? l / c.all_time_low * 100 : 0;
      return { symbol: c.symbol, highPrice: c.all_time_high, highCount: c.high_count, lowPrice: c.all_time_low, lowCount: c.low_count, currentPrice: l, highRatio: u, lowRatio: d };
    });
    return s.json({ success: true, updateTime: o.round_time, coins: a });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/compare/records", async (s) => {
  try {
    const e = parseInt(s.req.query("limit") || "100"), r = await new H(s.env.DB).getLatestExtremeRecords(e);
    return s.json({ success: true, records: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/compare/timestats", async (s) => {
  try {
    const t = await new H(s.env.DB).getTimeRangeStats();
    return s.json({ success: true, stats: t });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/extreme-records", async (s) => {
  try {
    const e = parseInt(s.req.query("limit") || "100"), r = await new H(s.env.DB).getLatestExtremeRecords(e);
    return s.json({ success: true, records: r, count: r.length });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/kline/sync", async (s) => {
  const e = new B(s.env.DB), t = s.req.query("timeframe") || "5m", r = parseInt(s.req.query("limit") || "300"), o = await e.syncAllKlineData(t, r);
  return s.json({ success: true, results: o });
});
m.get("/api/kline/:symbol", async (s) => {
  const e = s.req.param("symbol"), t = s.req.query("timeframe") || "5m", r = parseInt(s.req.query("limit") || "100"), n = await new B(s.env.DB).getKlineData(e, t, r);
  return s.json(n);
});
m.get("/api/kline/:symbol/stats", async (s) => {
  const e = s.req.param("symbol"), t = s.req.query("timeframe") || "5m", r = parseInt(s.req.query("limit") || "100"), n = await new B(s.env.DB).getKlineStats(e, t, r);
  return s.json(n);
});
m.get("/api/kline/:symbol/multi", async (s) => {
  const e = s.req.param("symbol"), r = await new B(s.env.DB).getMultiTimeframeData(e);
  return s.json(r);
});
m.get("/api/okx/config", async (s) => {
  const t = await new B(s.env.DB).getAllOKXConfigs();
  return s.json(t);
});
m.get("/api/kline/:symbol/indicators", async (s) => {
  const e = s.req.param("symbol"), t = s.req.query("timeframe") || "5m", r = parseInt(s.req.query("limit") || "300");
  try {
    const n = await new B(s.env.DB).getKlineWithIndicators(e, t, r);
    return s.json({ success: true, ...n });
  } catch (o) {
    return s.json({ success: false, error: o.message }, 400);
  }
});
m.post("/api/kline/indicators/batch", async (s) => {
  const e = await s.req.json(), t = e.symbols || [], r = e.timeframe || "5m", o = e.limit || 300, a = await new B(s.env.DB).getMultiSymbolIndicators(t, r, o);
  return s.json({ success: true, results: a });
});
m.post("/api/kline/:symbol/sync48h", async (s) => {
  const e = s.req.param("symbol");
  try {
    const r = await new B(s.env.DB).sync48HoursData(e);
    return s.json(r);
  } catch (t) {
    return s.json({ success: false, error: t.message }, 400);
  }
});
m.post("/api/kline/sync48h/all", async (s) => {
  const t = await new B(s.env.DB).syncAll48HoursData();
  return s.json({ success: true, results: t });
});
m.post("/api/kline/sync/auto", async (s) => {
  const e = Date.now();
  try {
    const t = new B(s.env.DB), r = "5m", o = 100;
    console.log(`\u{1F504} \u81EA\u52A8\u540C\u6B65\u5F00\u59CB: timeframe=${r}, limit=${o}`);
    const n = await t.syncAllKlineData(r, o), a = { total: n.length, success: n.filter((c) => c.success).length, failed: n.filter((c) => !c.success).length, duration: ((Date.now() - e) / 1e3).toFixed(2) };
    return console.log(`\u2705 \u81EA\u52A8\u540C\u6B65\u5B8C\u6210: ${a.success}/${a.total} \u6210\u529F, \u8017\u65F6 ${a.duration}\u79D2`), s.json({ success: true, message: "K\u7EBF\u6570\u636E\u81EA\u52A8\u540C\u6B65\u5B8C\u6210", summary: a, results: n });
  } catch (t) {
    const r = ((Date.now() - e) / 1e3).toFixed(2);
    return console.error(`\u274C \u81EA\u52A8\u540C\u6B65\u5931\u8D25 (\u8017\u65F6 ${r}\u79D2):`, t.message), s.json({ success: false, error: t.message, duration: r }, 500);
  }
});
m.get("/api/okx/config/:symbol", async (s) => {
  const e = s.req.param("symbol"), r = await new B(s.env.DB).getOKXConfig(e);
  return s.json(r);
});
m.get("/api/signal/all", async (s) => {
  const e = s.req.query("timeframe") || "5m", t = parseInt(s.req.query("limit") || "100"), r = s.req.query("telegram") !== "false";
  try {
    const o = new B(s.env.DB), n = new Qe(s.env.DB), c = (await o.getAllOKXConfigs()).map((d) => d.symbol), i = await n.detectMultiSymbolSignals(c, async (d) => (await o.getKlineWithIndicators(d, e, t)).data), l = n.generateSignalSummary(i);
    for (const [d, g] of Object.entries(i)) if (g.success) {
      const y = g.signals || [], p = g.alerts || [];
      await n.saveSignalsAndAlerts(y, p);
    }
    let u = { totalSent: 0, totalFailed: 0, totalSkipped: 0, symbols: [], details: [] };
    if (r) try {
      const d = new He("8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0", "-1003227444260"), g = await n.getSignalsToSend();
      console.log(`\u{1F4CA} \u4FE1\u53F7\u8FC7\u6EE4\u5B8C\u6210: ${g.length} \u4E2A\u4FE1\u53F7\u7B26\u5408\u53D1\u9001\u6761\u4EF6`);
      const y = /* @__PURE__ */ new Map();
      if (g.forEach((p) => {
        y.set(p.symbol, (y.get(p.symbol) || 0) + 1);
      }), g.length > 0) {
        console.log("\u{1F4E4} \u5F00\u59CB\u53D1\u9001\u4FE1\u53F7\u5230Telegram...");
        for (let p = 0; p < g.length; p++) {
          const _ = g[p];
          try {
            console.log(`   [${p + 1}/${g.length}] \u53D1\u9001 ${_.symbol} ${_.signal_type} \u4FE1\u53F7 (K\u7EBF: ${_.kline_time})...`), await d.sendTradingSignal(_), u.totalSent++, await n.markTradingSignalsAsSent([_.id]), await n.recordSignalSent(_.symbol, _.kline_time, "trading", _.id), u.symbols.includes(_.symbol) || u.symbols.push(_.symbol), u.details.push({ symbol: _.symbol, type: _.signal_type, klineTime: _.kline_time, signalTime: _.signal_time, price: _.price }), p < g.length - 1 && await new Promise((b) => setTimeout(b, 3e3));
          } catch (b) {
            console.error(`\u274C \u53D1\u9001\u4E70\u5356\u70B9\u4FE1\u53F7\u5931\u8D25 (${_.symbol}):`, b), b.message && b.message.includes("429") && (console.log("   \u23F3 \u9047\u5230\u901F\u7387\u9650\u5236\uFF0C\u7B49\u5F8510\u79D2\u540E\u7EE7\u7EED..."), await new Promise((w) => setTimeout(w, 1e4))), u.totalFailed++;
          }
        }
        console.log(`\u2705 Telegram\u53D1\u9001\u5B8C\u6210: ${u.totalSent} \u6761\u65B0\u4FE1\u53F7\u5DF2\u53D1\u9001`);
      } else console.log("\u2139\uFE0F  \u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4FE1\u53F7\u9700\u8981\u53D1\u9001");
    } catch (d) {
      console.error("\u274C Telegram\u53D1\u9001\u5931\u8D25:", d);
    }
    return s.json({ success: true, summary: l, results: i, telegram: u });
  } catch (o) {
    return s.json({ success: false, error: o.message }, 500);
  }
});
m.get("/api/signal/24h", async (s) => {
  const e = s.req.query("timeframe") || "5m";
  try {
    const t = new B(s.env.DB), r = new Qe(s.env.DB), n = { "5m": 288, "15m": 96, "1H": 24, "4H": 6, "1D": 1 }[e] || 288, c = (await t.getAllOKXConfigs()).map((u) => u.symbol), i = await r.detectMultiSymbolSignals(c, async (u) => (await t.getKlineWithIndicators(u, e, n)).data), l = r.generateSignalSummary(i);
    for (const [u, d] of Object.entries(i)) if (d.success) {
      const g = d.signals || [], y = d.alerts || [];
      await r.saveSignalsAndAlerts(g, y);
    }
    return s.json({ success: true, timeRange: "24h", timeframe: e, barsAnalyzed: n, summary: l, results: i });
  } catch (t) {
    return s.json({ success: false, error: t.message }, 500);
  }
});
m.get("/api/signal/history", async (s) => {
  const e = parseInt(s.req.query("hours") || "24"), t = parseInt(s.req.query("limit") || "1000"), r = s.req.query("symbol"), o = s.req.query("type");
  try {
    const n = new Qe(s.env.DB);
    let a = await n.getRecentTradingSignals(e, t), c = await n.getRecentAlertSignals(e, t);
    r && (a = a.filter((l) => l.symbol === r), c = c.filter((l) => l.symbol === r)), o && (a = a.filter((l) => l.signal_type === o));
    const i = { tradingSignals: { total: a.length, buy: a.filter((l) => l.signal_type === "BUY").length, sell: a.filter((l) => l.signal_type === "SELL").length }, alertSignals: { total: c.length }, timeRange: { hours: e, from: new Date(Date.now() - e * 60 * 60 * 1e3).toISOString(), to: (/* @__PURE__ */ new Date()).toISOString() } };
    return s.json({ success: true, stats: i, tradingSignals: a, alertSignals: c });
  } catch (n) {
    return s.json({ success: false, error: n.message }, 500);
  }
});
m.get("/api/signal/:symbol", async (s) => {
  const e = s.req.param("symbol"), t = s.req.query("timeframe") || "5m", r = parseInt(s.req.query("limit") || "100"), o = s.req.query("telegram") !== "false";
  try {
    const n = new B(s.env.DB), a = new Qe(s.env.DB), c = new H(s.env.DB), i = await n.getKlineWithIndicators(e, t, r), l = await s.env.DB.prepare("SELECT level FROM coin_priority WHERE symbol = ?").bind(e).first(), u = (l == null ? void 0 : l.level) || void 0, d = a.detectTradingSignals(i.data, u), g = d.signals || [], y = d.alerts || [];
    await a.saveSignalsAndAlerts(g, y);
    let p = { sent: 0, failed: 0, skipped: false };
    if (o && d.alerts && d.alerts.length > 0) try {
      const _ = /* @__PURE__ */ new Map();
      i.data.forEach((w) => {
        _.set(w.index, w);
      });
      let b = 0;
      if (i.data.length > 0) if (i.data[0].time) {
        const w = i.data[0].time.replace(/\//g, "-");
        b = new Date(w).getTime();
      } else i.data[0].open_time && (b = i.data[0].open_time);
      if (b === 0) p.skipped = true, console.log(`\u23ED\uFE0F  ${e} \u65E0\u6CD5\u83B7\u53D6K\u7EBF\u65F6\u95F4\u6233\uFF0C\u8DF3\u8FC7\u53D1\u9001`);
      else {
        const w = new Date(b), S = new Date(w);
        S.setMinutes(0, 0, 0);
        const T = new Date(S.getTime() - 3600 * 1e3), v = T.getTime(), f = d.alerts.filter((R) => {
          const A = _.get(R.index);
          if (!A) return false;
          let D = 0;
          if (A.time) {
            const q = A.time.replace(/\//g, "-");
            D = new Date(q).getTime();
          } else A.open_time && (D = A.open_time);
          if (!D) return false;
          const j = new Date(D), P = new Date(b);
          if (!(j.getUTCFullYear() === P.getUTCFullYear() && j.getUTCMonth() === P.getUTCMonth() && j.getUTCDate() === P.getUTCDate())) return console.log(`   \u23ED\uFE0F  \u8DF3\u8FC7\u65E7\u65E5\u671F\u9884\u8B66: ${R.time} (\u4E0D\u662F\u4ECA\u5929)`), false;
          const I = D >= v;
          return I || console.log(`   \u23ED\uFE0F  \u8DF3\u8FC7\u65E7\u65F6\u95F4\u9884\u8B66: ${R.time} (\u65E9\u4E8E${T.toISOString().substring(11, 16)})`), I;
        });
        if (f.length === 0) p.skipped = true, console.log(`\u23ED\uFE0F  ${e} \u65E0\u672C\u5C0F\u65F6\u548C\u4E0A\u4E00\u5C0F\u65F6\u7684\u9884\u8B66\uFF0C\u8DF3\u8FC7\u53D1\u9001`);
        else {
          const A = await new He("8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0", "-1003227444260").sendMultipleAlerts(f, _);
          p.sent = A, p.failed = f.length - A;
          const D = S.toISOString().substring(11, 16), j = T.toISOString().substring(11, 16);
          console.log(`\u{1F4E4} ${e} \u9884\u8B66\u5DF2\u53D1\u9001\u5230Telegram: ${A}/${f.length} (\u8FC7\u6EE4\u524D: ${d.alerts.length}) [\u4EC5${j}-${D}xx]`);
        }
      }
    } catch (_) {
      console.error(`\u274C ${e} Telegram\u53D1\u9001\u5931\u8D25:`, _), p.failed = d.alerts.length;
    }
    else o || (p.skipped = true);
    return s.json({ success: true, symbol: e, timeframe: t, telegram: p, ...d });
  } catch (n) {
    return s.json({ success: false, error: n.message }, 400);
  }
});
m.get("/compare", (s) => s.redirect("/compare.html"));
m.get("/kline", (s) => s.redirect("/kline.html"));
m.get("/signal", (s) => s.redirect("/signal.html"));
m.get("/api/telegram/test", async (s) => {
  try {
    if (!await new He("8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0", "-1003227444260").testConnection()) return s.json({ success: false, message: "Bot\u8FDE\u63A5\u6210\u529F\uFF0C\u4F46\u65E0\u6CD5\u9A8C\u8BC1Chat ID" });
    const o = await (await fetch("https://api.telegram.org/bot8437045462:AAFePnwdC21cqeWhZISMQHGGgjmroVqE2H0/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: "-1003227444260", text: "\u{1F9EA} \u6D4B\u8BD5\u6D88\u606F - Telegram\u8FDE\u63A5\u6210\u529F\uFF01" }) })).json();
    return s.json({ success: o.ok, result: o, help: o.ok ? null : { message: "\u8BF7\u786E\u4FDD\uFF1A", steps: ["1. Bot (@jamesyi_bot) \u5DF2\u6DFB\u52A0\u5230\u7FA4\u7EC4/\u9891\u9053", "2. Bot\u5728\u7FA4\u7EC4\u4E2D\u6709\u53D1\u9001\u6D88\u606F\u6743\u9650", "3. Chat ID\u6B63\u786E\uFF08-1003227444260\uFF09", "4. \u5982\u679C\u662F\u9891\u9053\uFF0C\u9700\u8981Bot\u662F\u7BA1\u7406\u5458"] } });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/", (s) => s.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\u52A0\u5BC6\u8D27\u5E01\u5B9E\u65F6\u76D1\u63A7\u7CFB\u7EDF</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .coin-row { transition: background-color 0.3s; }
            .coin-row:hover { background-color: #f3f4f6; }
            .green-text { color: #10b981; font-weight: bold; }
            .red-text { color: #ef4444; font-weight: bold; }
            .star-filled { color: #000; }
            .star-empty { color: #000; border: 1px solid #000; border-radius: 50%; }
            .status-badge { padding: 4px 12px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
            .level-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
            .level-1 { background: #fef3c7; color: #92400e; }
            .level-2 { background: #fde68a; color: #78350f; }
            .level-3 { background: #bfdbfe; color: #1e40af; }
            .level-4 { background: #ddd6fe; color: #5b21b6; }
            .level-5 { background: #d1fae5; color: #065f46; }
            .level-6 { background: #e5e7eb; color: #374151; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <div class="container mx-auto px-4 py-6">
            <!-- \u6807\u9898 -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                    \u52A0\u5BC6\u8D27\u5E01\u5B9E\u65F6\u76D1\u63A7\u7CFB\u7EDF
                </h1>
                <p class="text-gray-600">29\u79CD\u4E3B\u6D41\u5E01\u79CD \xB7 10\u5206\u949F\u81EA\u52A8\u66F4\u65B0 \xB7 \u7F8E\u5143\u8BA1\u4EF7</p>
            </div>

            <!-- \u63A7\u5236\u9762\u677F -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-cog mr-2"></i>\u63A7\u5236\u4E2D\u5FC3
                    </h2>
                    <div class="flex gap-2">
                        <a href="/trading.html" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-chart-line mr-2"></i>\u6A21\u62DF\u4EA4\u6613
                        </a>
                        <a href="/positions.html" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-wallet mr-2"></i>\u6301\u4ED3\u8FFD\u8E2A
                        </a>
                        <a href="/history.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-history mr-2"></i>\u5386\u53F2\u56DE\u770B
                        </a>
                        <a href="/compare.html" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-balance-scale mr-2"></i>\u6BD4\u4EF7\u6BD4\u5BF9
                        </a>
                        <a href="/signal.html" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-signal mr-2"></i>\u4E70\u5356\u70B9\u4FE1\u53F7
                        </a>
                        <a href="/kline.html" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-chart-candlestick mr-2"></i>K\u7EBF\u67E5\u8BE2
                        </a>
                        <a href="/pattern.html" class="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-brain mr-2"></i>\u7279\u5F81\u5E93
                        </a>
                        <a href="/correct.html" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-edit mr-2"></i>\u6570\u636E\u7EA0\u9519
                        </a>
                        <a href="/import.html" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-file-import mr-2"></i>\u6279\u91CF\u5BFC\u5165
                        </a>
                        <button id="analyzeBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-play mr-2"></i>\u6267\u884C\u5206\u6790
                        </button>
                        <button id="autoToggleBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition">
                            <i class="fas fa-pause mr-2"></i>\u6682\u505C\u81EA\u52A8
                        </button>
                    </div>
                </div>
                <div id="statusMessage" class="hidden p-4 rounded-lg mb-4"></div>
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <div>
                        <i class="fas fa-info-circle mr-2"></i>
                        \u6570\u636E\u6E90: CoinGecko API \xB7 \u81EA\u52A8\u5206\u6790: \u6BCF10\u5206\u949F\u4E00\u8F6E \xB7 \u70B9\u51FB"K\u7EBF\u67E5\u8BE2"\u67E5\u770BOKX\u5386\u53F2K\u7EBF
                    </div>
                    <div id="countdownDisplay" class="text-blue-600 font-semibold">
                        <i class="fas fa-clock mr-1"></i>
                        \u4E0B\u6B21\u5206\u6790: <span id="countdown">--:--</span>
                    </div>
                </div>
            </div>

            <!-- \u{1F195} \u91CD\u70B9\u7EDF\u8BA1\u9762\u677F - \u663E\u773C\u4F4D\u7F6E -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
                    <i class="fas fa-fire mr-3"></i>\u4ECA\u65E5\u91CD\u70B9\u7EDF\u8BA1
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- 24h\u6DA8\u5E45>10% -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-arrow-up mr-1"></i>24h\u6DA8\u5E45>10%
                        </div>
                        <div class="text-3xl font-bold text-white mb-1" id="change24hOver10Up">-</div>
                        <div class="text-white text-opacity-80 text-xs">
                            \u5360\u6BD4 <span id="change24hOver10UpPercent" class="font-bold">-</span>
                        </div>
                    </div>
                    
                    <!-- 24h\u8DCC\u5E45>10% -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-arrow-down mr-1"></i>24h\u8DCC\u5E45>10%
                        </div>
                        <div class="text-3xl font-bold text-white mb-1" id="change24hOver10Down">-</div>
                        <div class="text-white text-opacity-80 text-xs">
                            \u5360\u6BD4 <span id="change24hOver10DownPercent" class="font-bold">-</span>
                        </div>
                    </div>
                    
                    <!-- \u4ECA\u65E5\u521B\u65B0\u9AD8\u6B21\u6570 -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-trophy mr-1"></i>\u4ECA\u65E5\u521B\u65B0\u9AD8
                        </div>
                        <div class="text-3xl font-bold text-white" id="todayNewHighCount">-</div>
                        <div class="text-white text-opacity-80 text-xs">\u603B\u6B21\u6570</div>
                    </div>
                    
                    <!-- \u4ECA\u65E5\u521B\u65B0\u4F4E\u6B21\u6570 -->
                    <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <div class="text-white text-opacity-90 text-sm mb-2">
                            <i class="fas fa-chart-line mr-1"></i>\u4ECA\u65E5\u521B\u65B0\u4F4E
                        </div>
                        <div class="text-3xl font-bold text-white" id="todayNewLowCount">-</div>
                        <div class="text-white text-opacity-80 text-xs">\u603B\u6B21\u6570</div>
                    </div>
                </div>
            </div>

            <!-- \u7EDF\u8BA1\u5361\u7247 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <!-- \u57FA\u7840\u7EDF\u8BA1 -->
                <div id="statsCards" class="col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <!-- \u7EDF\u8BA1\u5361\u7247\u5C06\u5728\u8FD9\u91CC\u52A8\u6001\u751F\u6210\uFF08\u73B0\u5728\u67095\u4E2A\u5361\u7247\uFF09 -->
                </div>
                
                <!-- \u6025\u6DA8\u6025\u8DCC\u7EDF\u8BA1 -->
                <div class="col-span-2 bg-white rounded-lg shadow-md p-4">
                    <h3 class="text-sm font-bold text-gray-700 mb-3 border-b pb-2">
                        <i class="fas fa-bolt mr-1"></i>\u6025\u6DA8\u6025\u8DCC\u7EDF\u8BA1
                    </h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">\u672C\u8F6E\u6025\u6DA8:</span>
                            <span id="currentSurge" class="font-bold text-green-600">-</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">\u672C\u8F6E\u6025\u8DCC:</span>
                            <span id="currentCrash" class="font-bold text-red-600">-</span>
                        </div>
                        <div class="flex justify-between items-center border-t pt-2">
                            <span class="text-gray-600">\u603B\u6025\u6DA8:</span>
                            <span id="totalSurge" class="font-bold text-green-600">-</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">\u603B\u6025\u8DCC:</span>
                            <span id="totalCrash" class="font-bold text-red-600">-</span>
                        </div>
                        <div class="flex justify-between items-center border-t pt-2">
                            <span class="text-gray-600">\u5DEE\u503C:</span>
                            <span id="surgeDiff" class="font-bold text-blue-600">-</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">\u6BD4\u503C:</span>
                            <span id="surgeRatio" class="font-bold text-purple-600">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- \u5E02\u573A\u8D8B\u52BF -->
            <div id="marketTrend" class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-area mr-2"></i>\u5E02\u573A\u8D8B\u52BF\u5206\u6790
                </h2>
                <div id="trendContent" class="text-gray-600 text-center py-8">
                    \u6682\u65E0\u6570\u636E\uFF0C\u8BF7\u6267\u884C\u7B2C\u4E00\u6B21\u5206\u6790
                </div>
            </div>

            <!-- \u5E01\u79CD\u5217\u8868 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-coins mr-2"></i>\u5B9E\u65F6\u5E01\u4EF7\u76D1\u63A7
                </h2>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b-2 border-gray-200 text-xs">
                                <th class="text-center py-2 px-1">\u5E8F\u53F7</th>
                                <th class="text-left py-2 px-1">\u5E01\u540D</th>
                                <th class="text-center py-2 px-1">\u4E0A\u8F6E\u6DA8\u8DCC</th>
                                <th class="text-center py-2 px-1">\u5F53\u5929\u6025\u6DA8\u6B21\u6570</th>
                                <th class="text-center py-2 px-1">\u5F53\u5929\u6025\u8DCC\u6B21\u6570</th>
                                <th class="text-center py-2 px-1">+4%</th>
                                <th class="text-center py-2 px-1">-3%</th>
                                <th class="text-center py-2 px-1">\u4ECA\u65E5V1</th>
                                <th class="text-right py-2 px-1">\u66F4\u65B0\u65F6\u95F4</th>
                                <th class="text-right py-2 px-1">\u5386\u53F2\u9AD8\u4EF7</th>
                                <th class="text-right py-2 px-1">\u9AD8\u7684\u65F6\u95F4</th>
                                <th class="text-right py-2 px-1">\u6DA8\u5E45</th>
                                <th class="text-right py-2 px-1">24\u6DA8\u5E45</th>
                                <th class="text-center py-2 px-1">++</th>
                                <th class="text-center py-2 px-1">--</th>
                                <th class="text-center py-2 px-1">\u6392\u884C</th>
                                <th class="text-center py-2 px-1">\u4F18\u5148\u7EA7</th>
                                <th class="text-right py-2 px-1">\u8FD9\u8F6E\u4EF7\u683C</th>
                                <th class="text-right py-2 px-1">\u6700\u9AD8\u5360\u6BD4</th>
                                <th class="text-right py-2 px-1">\u6700\u4F4E\u5360\u6BD4</th>
                                <th class="text-center py-2 px-1">\u5F02\u52A8</th>
                            </tr>
                        </thead>
                        <tbody id="coinTableBody">
                            <tr>
                                <td colspan="21" class="text-center py-8 text-gray-500">
                                    \u52A0\u8F7D\u4E2D...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
        <script src="/static/app.js"><\/script>
    </body>
    </html>
  `));
m.get("/api/positions", async (s) => {
  try {
    const e = new Pe(s.env.DB), t = await e.getActivePositions(), r = await e.enrichPositionsWithCurrentPrice(t);
    return s.json({ success: true, positions: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/positions", async (s) => {
  try {
    const e = await s.req.json(), r = await new Pe(s.env.DB).addPosition({ symbol: e.symbol, positionType: e.position_type, entryPrice: parseFloat(e.entry_price), quantity: e.quantity ? parseFloat(e.quantity) : void 0, stopLoss: e.stop_loss ? parseFloat(e.stop_loss) : void 0, takeProfit: e.take_profit ? parseFloat(e.take_profit) : void 0, notes: e.notes });
    return s.json({ success: true, data: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/positions/:id", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), t = await s.req.json(), o = await new Pe(s.env.DB).updatePosition(e, { quantity: t.quantity ? parseFloat(t.quantity) : void 0, stopLoss: t.stopLoss ? parseFloat(t.stopLoss) : void 0, takeProfit: t.takeProfit ? parseFloat(t.takeProfit) : void 0, notes: t.notes });
    return s.json({ success: true, data: o });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/positions/:id/close", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), t = await s.req.json(), o = await new Pe(s.env.DB).closePosition(e, parseFloat(t.closedPrice));
    return s.json({ success: true, data: o });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.delete("/api/positions/:id", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), r = await new Pe(s.env.DB).deletePosition(e);
    return s.json({ success: true, data: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/positions/check-alerts", async (s) => {
  try {
    const e = new Pe(s.env.DB), t = new B(s.env.DB), r = await e.getActivePositions();
    if (r.length === 0) return s.json({ success: true, alerts: [], message: "\u6682\u65E0\u6D3B\u8DC3\u6301\u4ED3" });
    const o = [...new Set(r.map((l) => l.symbol))], n = /* @__PURE__ */ new Map();
    for (const l of o) {
      const u = await t.getKlineWithIndicators(l, "5m", 1);
      u.data && u.data.length > 0 && n.set(l, u.data[0]);
    }
    const a = Array.from(n.values()), c = await e.checkPositionAlerts(a);
    let i = 0;
    if (c.length > 0 && s.env.TELEGRAM_BOT_TOKEN && s.env.TELEGRAM_CHAT_ID) {
      const l = new He(s.env.TELEGRAM_BOT_TOKEN, s.env.TELEGRAM_CHAT_ID);
      for (const u of c) await l.sendPositionAlert(u) && (i++, await e.savePositionAlert({ ...u, telegramSent: true }));
    }
    return s.json({ success: true, alerts: c, telegram: { sent: i, total: c.length } });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/simulated/accounts", async (s) => {
  try {
    const t = await new X(s.env.DB).getAllAccounts();
    return s.json({ success: true, accounts: t });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/simulated/accounts", async (s) => {
  try {
    const e = await s.req.json(), r = await new X(s.env.DB).createAccount({ accountName: e.account_name, initialBalance: parseFloat(e.initial_balance), leverage: e.leverage ? parseFloat(e.leverage) : void 0, tradingFeeRate: e.trading_fee_rate ? parseFloat(e.trading_fee_rate) : void 0 });
    return s.json({ success: true, data: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/simulated/accounts/:id", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), r = await new X(s.env.DB).getAccount(e);
    return s.json({ success: true, account: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/simulated/accounts/:id/status", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), t = await s.req.json();
    return await new X(s.env.DB).updateAccountStatus(e, t.status), s.json({ success: true });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/simulated/accounts/:id/positions", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), r = await new X(s.env.DB).getOpenTrades(e);
    return s.json({ success: true, positions: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/simulated/accounts/:id/history", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), t = parseInt(s.req.query("limit") || "100"), o = await new X(s.env.DB).getTradeHistory(e, t);
    return s.json({ success: true, history: o });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/simulated/trades/open", async (s) => {
  try {
    const e = await s.req.json(), r = await new X(s.env.DB).openTrade({ accountId: e.account_id, strategyId: e.strategy_id, symbol: e.symbol, positionType: e.position_type, entryPrice: parseFloat(e.entry_price), quantity: parseFloat(e.quantity), signalSource: e.signal_source, notes: e.notes });
    return s.json({ success: true, data: r });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/simulated/trades/:id/close", async (s) => {
  try {
    const e = parseInt(s.req.param("id")), t = await s.req.json(), o = await new X(s.env.DB).closeTrade(e, parseFloat(t.exit_price));
    return s.json({ success: true, data: o });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/simulated/auto-trade", async (s) => {
  try {
    const e = await s.req.json(), r = await new X(s.env.DB).executeTradeBySignal({ accountId: e.account_id, strategyId: e.strategy_id, symbol: e.symbol, signalType: e.signal_type, currentPrice: parseFloat(e.current_price), quantity: e.quantity ? parseFloat(e.quantity) : void 0 });
    return s.json(r);
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/simulated/auto-trade-all", async (s) => {
  try {
    const e = await s.req.json(), r = await new X(s.env.DB).autoTradeAllSymbols(e.account_id, e.strategy_id);
    return s.json(r);
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/simulated/strategies", async (s) => {
  try {
    const t = await new X(s.env.DB).getAllStrategies();
    return s.json({ success: true, strategies: t });
  } catch (e) {
    return s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/convergence/:symbol", async (s) => {
  const e = s.req.param("symbol"), t = parseInt(s.req.query("days") || "30");
  try {
    const { ConvergenceStatsService: r } = await Promise.resolve().then(() => dt), n = await new r(s.env.DB).getConvergenceStats(e, t);
    return n ? s.json({ success: true, stats: n }) : s.json({ success: false, message: "\u6682\u65E0\u9707\u8361\u6536\u655B\u6570\u636E" });
  } catch (r) {
    return console.error("\u83B7\u53D6\u9707\u8361\u6536\u655B\u7EDF\u8BA1\u5931\u8D25:", r), s.json({ success: false, error: r.message }, 500);
  }
});
m.get("/api/convergence/all/stats", async (s) => {
  const e = parseInt(s.req.query("days") || "30");
  try {
    const { ConvergenceStatsService: t } = await Promise.resolve().then(() => dt), o = await new t(s.env.DB).getAllConvergenceStats(e);
    return s.json({ success: true, stats: o });
  } catch (t) {
    return console.error("\u83B7\u53D6\u6240\u6709\u9707\u8361\u6536\u655B\u7EDF\u8BA1\u5931\u8D25:", t), s.json({ success: false, error: t.message }, 500);
  }
});
m.get("/api/convergence/:symbol/today", async (s) => {
  const e = s.req.param("symbol");
  try {
    const { ConvergenceStatsService: t } = await Promise.resolve().then(() => dt), o = await new t(s.env.DB).getTodayConvergenceCount(e);
    return s.json({ success: true, symbol: e, count: o });
  } catch (t) {
    return console.error("\u83B7\u53D6\u4ECA\u65E5\u9707\u8361\u6536\u655B\u6B21\u6570\u5931\u8D25:", t), s.json({ success: false, error: t.message }, 500);
  }
});
m.post("/api/pattern/analyze", async (s) => {
  try {
    const e = new et(s.env.DB), o = (await new H(s.env.DB).getAllCoins()).map((a) => a.symbol), n = { surge: 0, crash: 0, processed: [] };
    for (const a of o) {
      const c = await e.analyzeSurgePatterns(a);
      for (const l of c) await e.savePattern("surge", l), n.surge++;
      const i = await e.analyzeCrashPatterns(a);
      for (const l of i) await e.savePattern("crash", l), n.crash++;
      n.processed.push(a);
    }
    return s.json({ success: true, message: "\u7279\u5F81\u5206\u6790\u5B8C\u6210", results: n });
  } catch (e) {
    return console.error("\u7279\u5F81\u5206\u6790\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/pattern/surge", async (s) => {
  try {
    const e = new et(s.env.DB), t = parseInt(s.req.query("limit") || "100"), r = await e.getSurgePatterns(t);
    return s.json({ success: true, patterns: r });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8D77\u6DA8\u6A21\u5F0F\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/pattern/crash", async (s) => {
  try {
    const e = new et(s.env.DB), t = parseInt(s.req.query("limit") || "100"), r = await e.getCrashPatterns(t);
    return s.json({ success: true, patterns: r });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8D77\u8DCC\u6A21\u5F0F\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/pattern/stats", async (s) => {
  try {
    const t = await new et(s.env.DB).getPatternStats();
    return s.json({ success: true, stats: t });
  } catch (e) {
    return console.error("\u83B7\u53D6\u7279\u5F81\u7EDF\u8BA1\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/correct/data", async (s) => {
  try {
    const e = s.req.query("date") || "";
    if (!e) return s.json({ success: false, error: "\u8BF7\u63D0\u4F9B\u65E5\u671F\u53C2\u6570" }, 400);
    const r = await new H(s.env.DB).getTodayStats(e);
    return s.json({ success: true, data: r });
  } catch (e) {
    return console.error("\u83B7\u53D6\u6570\u636E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/correct/save", async (s) => {
  try {
    const { date: e, updates: t } = await s.req.json();
    if (!e || !t || !Array.isArray(t)) return s.json({ success: false, error: "\u53C2\u6570\u9519\u8BEF" }, 400);
    console.log(`\u{1F4DD} \u5F00\u59CB\u4FDD\u5B58\u6570\u636E: \u65E5\u671F=${e}, \u66F4\u65B0\u6570\u91CF=${t.length}`);
    const r = t.map((a) => (console.log(`  \u66F4\u65B0\u5E01\u79CD: ${a.symbol}, \u6025\u6DA8=${a.total_surges}, \u6025\u8DCC=${a.total_crashes}, \u65B0\u9AD8=${a.new_high_count}, \u65B0\u4F4E=${a.new_low_count}`), s.env.DB.prepare(`
          INSERT INTO daily_stats (date, symbol, total_surges, total_crashes, new_high_count, new_low_count)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(date, symbol) DO UPDATE SET
            total_surges = excluded.total_surges,
            total_crashes = excluded.total_crashes,
            new_high_count = excluded.new_high_count,
            new_low_count = excluded.new_low_count
        `).bind(e, a.symbol, a.total_surges || 0, a.total_crashes || 0, a.new_high_count || 0, a.new_low_count || 0))), o = await s.env.DB.batch(r);
    console.log(`\u2705 \u6279\u91CF\u66F4\u65B0\u5B8C\u6210\uFF0C\u7ED3\u679C\u6570\u91CF: ${o.length}`);
    let n = 0;
    return o.forEach((a, c) => {
      a.success ? n++ : console.error(`\u274C \u66F4\u65B0\u5931\u8D25 [${t[c].symbol}]:`, a.error);
    }), console.log(`\u2705 \u4FDD\u5B58\u6210\u529F: ${n}/${t.length}`), s.json({ success: true, message: `\u6570\u636E\u5DF2\u4FDD\u5B58 (${n}/${t.length})`, successCount: n, totalCount: t.length });
  } catch (e) {
    return console.error("\u274C \u4FDD\u5B58\u6570\u636E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/correct/reset", async (s) => {
  try {
    const { date: e } = await s.req.json();
    return e ? (await s.env.DB.prepare(`
        UPDATE daily_stats 
        SET total_surges = 0, 
            total_crashes = 0, 
            new_high_count = 0, 
            new_low_count = 0
        WHERE date = ?
      `).bind(e).run(), s.json({ success: true, message: "\u6570\u636E\u5DF2\u6E05\u7A7A" })) : s.json({ success: false, error: "\u8BF7\u63D0\u4F9B\u65E5\u671F\u53C2\u6570" }, 400);
  } catch (e) {
    return console.error("\u6E05\u7A7A\u6570\u636E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/correct/rounds", async (s) => {
  try {
    const e = s.req.query("date") || "";
    if (!e) return s.json({ success: false, error: "\u8BF7\u63D0\u4F9B\u65E5\u671F\u53C2\u6570" }, 400);
    const r = await new H(s.env.DB).getRoundStatsByDate(e);
    return s.json({ success: true, rounds: r });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8F6E\u6B21\u6570\u636E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/correct/rounds/save", async (s) => {
  try {
    const { updates: e } = await s.req.json();
    if (!e || !Array.isArray(e)) return s.json({ success: false, error: "\u53C2\u6570\u9519\u8BEF" }, 400);
    console.log(`\u{1F4DD} \u5F00\u59CB\u4FDD\u5B58\u8F6E\u6B21\u98CE\u9669\u63D0\u793A\u6570\u636E: \u66F4\u65B0\u6570\u91CF=${e.length}`);
    const t = e.map((n) => (console.log(`  \u66F4\u65B0\u8F6E\u6B21: ${n.round_time}, \u98CE\u9669\u63D0\u793A=${n.risk_alert_count}`), s.env.DB.prepare(`
          INSERT INTO round_stats (round_time, risk_alert_count, green_count, red_count, surge_count, crash_count)
          VALUES (?, ?, 0, 0, 0, 0)
          ON CONFLICT(round_time) DO UPDATE SET
            risk_alert_count = excluded.risk_alert_count
        `).bind(n.round_time, n.risk_alert_count || 0))), r = await s.env.DB.batch(t);
    console.log(`\u2705 \u6279\u91CF\u66F4\u65B0\u5B8C\u6210\uFF0C\u7ED3\u679C\u6570\u91CF: ${r.length}`);
    let o = 0;
    return r.forEach((n, a) => {
      n.success ? o++ : console.error(`\u274C \u66F4\u65B0\u5931\u8D25 [${e[a].round_time}]:`, n.error);
    }), console.log(`\u2705 \u4FDD\u5B58\u6210\u529F: ${o}/${e.length}`), s.json({ success: true, message: `\u98CE\u9669\u63D0\u793A\u6570\u636E\u5DF2\u4FDD\u5B58 (${o}/${e.length})`, successCount: o, totalCount: e.length });
  } catch (e) {
    return console.error("\u274C \u4FDD\u5B58\u98CE\u9669\u63D0\u793A\u6570\u636E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/price/extreme/update", async (s) => {
  try {
    const { symbol: e, type: t, price: r } = await s.req.json();
    return !e || !t || !r ? s.json({ success: false, error: "\u53C2\u6570\u4E0D\u5B8C\u6574" }, 400) : (await new H(s.env.DB).updatePriceExtreme(e, t, r), s.json({ success: true, message: `${e} \u7684${t === "high" ? "\u6700\u9AD8" : "\u6700\u4F4E"}\u4EF7\u683C\u5DF2\u66F4\u65B0` }));
  } catch (e) {
    return console.error("\u66F4\u65B0\u4EF7\u683C\u6781\u503C\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/extremes/import", async (s) => {
  try {
    const { symbol: e, all_time_high: t, high_count: r, all_time_low: o, low_count: n } = await s.req.json();
    return !e || !t || !o ? s.json({ success: false, error: "\u53C2\u6570\u4E0D\u5B8C\u6574" }, 400) : (await s.env.DB.prepare(`
      INSERT OR REPLACE INTO price_extremes (symbol, all_time_high, high_count, all_time_low, low_count, last_updated)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(e, t, r || 0, o, n || 0).run(), s.json({ success: true, message: `${e} \u6570\u636E\u5DF2\u5BFC\u5165` }));
  } catch (e) {
    return console.error("\u5BFC\u5165\u4EF7\u683C\u6781\u503C\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/settings", async (s) => {
  try {
    const t = await new Ue(s.env.DB).getAllSettings();
    return s.json({ success: true, settings: t });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8BBE\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/settings/category/:category", async (s) => {
  try {
    const e = s.req.param("category"), r = await new Ue(s.env.DB).getSettingsByCategory(e);
    return s.json({ success: true, settings: r });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8BBE\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/settings/:key", async (s) => {
  try {
    const e = s.req.param("key"), { value: t } = await s.req.json();
    return await new Ue(s.env.DB).updateSetting(e, t), s.json({ success: true, message: "\u8BBE\u7F6E\u5DF2\u66F4\u65B0" });
  } catch (e) {
    return console.error("\u66F4\u65B0\u8BBE\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/settings", async (s) => {
  try {
    const { settings: e } = await s.req.json();
    return await new Ue(s.env.DB).updateSettings(e), s.json({ success: true, message: "\u8BBE\u7F6E\u5DF2\u6279\u91CF\u66F4\u65B0" });
  } catch (e) {
    return console.error("\u6279\u91CF\u66F4\u65B0\u8BBE\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/settings/reset", async (s) => {
  try {
    return await new Ue(s.env.DB).resetToDefaults(), s.json({ success: true, message: "\u8BBE\u7F6E\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u503C" });
  } catch (e) {
    return console.error("\u91CD\u7F6E\u8BBE\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/signal-config", async (s) => {
  try {
    const e = await s.env.DB.prepare("SELECT * FROM signal_send_config ORDER BY signal_category, signal_type").all();
    return s.json({ success: true, configs: e.results });
  } catch (e) {
    return console.error("\u83B7\u53D6\u4FE1\u53F7\u914D\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/signal-config", async (s) => {
  try {
    const e = await s.req.json(), { signal_category: t, signal_type: r, enabled: o } = e;
    return !t || !r || o === void 0 ? s.json({ success: false, error: "\u7F3A\u5C11\u5FC5\u9700\u53C2\u6570: signal_category, signal_type, enabled" }, 400) : (await s.env.DB.prepare(`
        UPDATE signal_send_config 
        SET enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE signal_category = ? AND signal_type = ?
      `).bind(o ? 1 : 0, t, r).run(), s.json({ success: true, message: `\u4FE1\u53F7\u914D\u7F6E\u5DF2\u66F4\u65B0: ${t}:${r} = ${o ? "\u542F\u7528" : "\u7981\u7528"}` }));
  } catch (e) {
    return console.error("\u66F4\u65B0\u4FE1\u53F7\u914D\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/signal-config/batch", async (s) => {
  try {
    const e = await s.req.json(), { configs: t } = e;
    if (!Array.isArray(t)) return s.json({ success: false, error: "configs\u5FC5\u987B\u662F\u6570\u7EC4" }, 400);
    for (const r of t) {
      const { signal_category: o, signal_type: n, enabled: a } = r;
      await s.env.DB.prepare(`
          UPDATE signal_send_config 
          SET enabled = ?, updated_at = CURRENT_TIMESTAMP
          WHERE signal_category = ? AND signal_type = ?
        `).bind(a ? 1 : 0, o, n).run();
    }
    return s.json({ success: true, message: `\u6279\u91CF\u66F4\u65B0\u5B8C\u6210: ${t.length} \u4E2A\u914D\u7F6E\u5DF2\u66F4\u65B0` });
  } catch (e) {
    return console.error("\u6279\u91CF\u66F4\u65B0\u4FE1\u53F7\u914D\u7F6E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/trading-rules/stats", async (s) => {
  try {
    const t = await new W(s.env.DB).getTradingStats();
    return s.json({ success: true, stats: t });
  } catch (e) {
    return console.error("\u83B7\u53D6\u4EA4\u6613\u7EDF\u8BA1\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/trading-rules", async (s) => {
  try {
    const t = await new W(s.env.DB).getAllRules();
    return s.json({ success: true, rules: t });
  } catch (e) {
    return console.error("\u83B7\u53D6\u4EA4\u6613\u89C4\u5219\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/apply-unilateral-strategy", async (s) => {
  try {
    const e = new W(s.env.DB), t = await e.getTodayMarketStats(), r = await e.applyUnilateralStrategy(t.todaySurgeCount, t.todayCrashCount);
    return s.json({ success: true, message: `\u5DF2\u5E94\u7528\u5355\u8FB9\u7B56\u7565\uFF1A${r.strategy}`, strategy: r.strategy, todaySurgeCount: t.todaySurgeCount, todayCrashCount: t.todayCrashCount, long_allowed: r.long_allowed, short_allowed: r.short_allowed });
  } catch (e) {
    return console.error("\u5E94\u7528\u5355\u8FB9\u7B56\u7565\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/trading-rules/market-strategy", async (s) => {
  try {
    const t = await new W(s.env.DB).getTodayMarketStats();
    let r = "", o = true, n = true;
    return t.todaySurgeCount > 0 && t.todayCrashCount === 0 ? (r = "\u5355\u8FB9\u4E3B\u5347", o = true, n = false) : t.todayCrashCount > 0 && t.todaySurgeCount === 0 ? (r = "\u5355\u8FB9\u4E3B\u8DCC", o = false, n = true) : (r = "\u53CC\u8FB9\u9707\u8361", o = true, n = true), s.json({ success: true, todaySurgeCount: t.todaySurgeCount, todayCrashCount: t.todayCrashCount, strategy: r, long_allowed: o, short_allowed: n, recommendation: r === "\u5355\u8FB9\u4E3B\u5347" ? "\u5EFA\u8BAE\uFF1A\u53EA\u505A\u591A\u5355\uFF0C\u7981\u6B62\u505A\u7A7A" : r === "\u5355\u8FB9\u4E3B\u8DCC" ? "\u5EFA\u8BAE\uFF1A\u53EA\u505A\u7A7A\u5355\uFF0C\u7981\u6B62\u505A\u591A" : "\u5EFA\u8BAE\uFF1A\u53EF\u4EE5\u505A\u591A\u505A\u7A7A" });
  } catch (e) {
    return console.error("\u83B7\u53D6\u5E02\u573A\u7B56\u7565\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/trading-rules/:symbol", async (s) => {
  try {
    const e = s.req.param("symbol"), r = await new W(s.env.DB).getRuleBySymbol(e);
    return r ? s.json({ success: true, rule: r }) : s.json({ success: false, error: "\u672A\u627E\u5230\u8BE5\u5E01\u79CD\u7684\u4EA4\u6613\u89C4\u5219" }, 404);
  } catch (e) {
    return console.error("\u83B7\u53D6\u4EA4\u6613\u89C4\u5219\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/trading-rules/:symbol", async (s) => {
  try {
    const e = s.req.param("symbol"), t = await s.req.json(), { trading_allowed: r, long_allowed: o, short_allowed: n, notes: a } = t;
    return await new W(s.env.DB).updateRule({ symbol: e, trading_allowed: r, long_allowed: o, short_allowed: n, notes: a }), s.json({ success: true, message: `${e} \u4EA4\u6613\u89C4\u5219\u5DF2\u66F4\u65B0` });
  } catch (e) {
    return console.error("\u66F4\u65B0\u4EA4\u6613\u89C4\u5219\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/batch", async (s) => {
  try {
    const e = await s.req.json(), { updates: t } = e;
    return Array.isArray(t) ? (await new W(s.env.DB).batchUpdateRules(t), s.json({ success: true, message: `\u6279\u91CF\u66F4\u65B0\u5B8C\u6210: ${t.length} \u4E2A\u89C4\u5219\u5DF2\u66F4\u65B0` })) : s.json({ success: false, error: "updates\u5FC5\u987B\u662F\u6570\u7EC4" }, 400);
  } catch (e) {
    return console.error("\u6279\u91CF\u66F4\u65B0\u4EA4\u6613\u89C4\u5219\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/reset", async (s) => {
  try {
    return await new W(s.env.DB).resetAllRules(), s.json({ success: true, message: "\u6240\u6709\u89C4\u5219\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\uFF08\u5141\u8BB8\u6240\u6709\u4EA4\u6613\uFF09" });
  } catch (e) {
    return console.error("\u91CD\u7F6E\u4EA4\u6613\u89C4\u5219\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/disable-all", async (s) => {
  try {
    return await new W(s.env.DB).disableAllTrading(), s.json({ success: true, message: "\u5DF2\u7981\u6B62\u6240\u6709\u5E01\u79CD\u7684\u4EA4\u6613" });
  } catch (e) {
    return console.error("\u7981\u6B62\u6240\u6709\u4EA4\u6613\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/long-only", async (s) => {
  try {
    return await new W(s.env.DB).setLongOnly(), s.json({ success: true, message: "\u5DF2\u8BBE\u7F6E\u6240\u6709\u5E01\u79CD\u4E3A\u4EC5\u5141\u8BB8\u505A\u591A" });
  } catch (e) {
    return console.error("\u8BBE\u7F6E\u4EC5\u5141\u8BB8\u505A\u591A\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/short-only", async (s) => {
  try {
    return await new W(s.env.DB).setShortOnly(), s.json({ success: true, message: "\u5DF2\u8BBE\u7F6E\u6240\u6709\u5E01\u79CD\u4E3A\u4EC5\u5141\u8BB8\u505A\u7A7A" });
  } catch (e) {
    return console.error("\u8BBE\u7F6E\u4EC5\u5141\u8BB8\u505A\u7A7A\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/trading-rules/apply-risk-rules", async (s) => {
  try {
    const { riskLevel: e } = await s.req.json();
    return !e || !["\u9AD8\u98CE\u9669", "\u4E2D\u98CE\u9669", "\u4F4E\u98CE\u9669"].includes(e) ? s.json({ success: false, error: "\u65E0\u6548\u7684\u98CE\u9669\u7B49\u7EA7\uFF0C\u5FC5\u987B\u662F\uFF1A\u9AD8\u98CE\u9669\u3001\u4E2D\u98CE\u9669\u6216\u4F4E\u98CE\u9669" }, 400) : (await new W(s.env.DB).applyRiskBasedRules(e), s.json({ success: true, message: `\u5DF2\u5E94\u7528${e}\u4EA4\u6613\u89C4\u5219`, riskLevel: e }));
  } catch (e) {
    return console.error("\u5E94\u7528\u98CE\u9669\u89C4\u5219\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/trading-rules/allowed-by-risk", async (s) => {
  try {
    const e = s.req.query("riskLevel");
    if (!e || !["\u9AD8\u98CE\u9669", "\u4E2D\u98CE\u9669", "\u4F4E\u98CE\u9669"].includes(e)) return s.json({ success: false, error: "\u65E0\u6548\u7684\u98CE\u9669\u7B49\u7EA7" }, 400);
    const r = await new W(s.env.DB).getAllowedCoinsByRisk(e);
    return s.json({ success: true, riskLevel: e, allowedCoins: r, count: r.length });
  } catch (e) {
    return console.error("\u83B7\u53D6\u5141\u8BB8\u4EA4\u6613\u5E01\u79CD\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/trading-strategies", async (s) => {
  try {
    const e = await s.env.DB.prepare(`
        SELECT * FROM trading_strategies
        ORDER BY is_active DESC, strategy_type
      `).all();
    return s.json({ success: true, strategies: e.results, count: e.results.length });
  } catch (e) {
    return console.error("\u83B7\u53D6\u4EA4\u6613\u7B56\u7565\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.put("/api/trading-strategies/:id", async (s) => {
  try {
    const e = s.req.param("id"), { is_active: t, config: r } = await s.req.json();
    return await s.env.DB.prepare(`
        UPDATE trading_strategies
        SET is_active = ?, 
            config = COALESCE(?, config),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(t, r, e).run(), s.json({ success: true, message: "\u7B56\u7565\u5DF2\u66F4\u65B0" });
  } catch (e) {
    return console.error("\u66F4\u65B0\u4EA4\u6613\u7B56\u7565\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/coin-priority", async (s) => {
  try {
    const e = await s.env.DB.prepare(`
        SELECT * FROM coin_priority
        ORDER BY level, symbol
      `).all();
    return s.json({ success: true, coins: e.results, count: e.results.length });
  } catch (e) {
    return console.error("\u83B7\u53D6\u5E01\u79CD\u4F18\u5148\u7EA7\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/support-lines", async (s) => {
  try {
    const t = await new be(s.env.DB).getTodaySupportLines();
    return s.json({ success: true, lines: t, count: t.length });
  } catch (e) {
    return console.error("\u83B7\u53D6\u652F\u6491\u7EBF\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/support-lines/opportunities", async (s) => {
  try {
    const t = await new be(s.env.DB).getOpportunitySummary();
    return s.json({ success: true, ...t });
  } catch (e) {
    return console.error("\u68C0\u67E5\u4F4E\u5438\u673A\u4F1A\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/support-lines/:symbol", async (s) => {
  try {
    const e = s.req.param("symbol"), r = await new be(s.env.DB).getSupportLine(e);
    return r ? s.json({ success: true, line: r }) : s.json({ success: false, error: "\u672A\u627E\u5230\u8BE5\u5E01\u79CD\u7684\u652F\u6491\u7EBF" }, 404);
  } catch (e) {
    return console.error("\u83B7\u53D6\u652F\u6491\u7EBF\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/support-lines", async (s) => {
  try {
    const { symbol: e, support_price: t, notes: r } = await s.req.json();
    return !e || !t ? s.json({ success: false, error: "\u5E01\u79CD\u548C\u652F\u6491\u4EF7\u683C\u4E0D\u80FD\u4E3A\u7A7A" }, 400) : (await new be(s.env.DB).setSupportLine(e, t, r), s.json({ success: true, message: `${e} \u7684\u652F\u6491\u7EBF\u5DF2\u8BBE\u7F6E\u4E3A ${t}` }));
  } catch (e) {
    return console.error("\u8BBE\u7F6E\u652F\u6491\u7EBF\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/support-lines/batch", async (s) => {
  try {
    const { lines: e } = await s.req.json();
    return !e || !Array.isArray(e) || e.length === 0 ? s.json({ success: false, error: "\u53C2\u6570\u9519\u8BEF" }, 400) : (await new be(s.env.DB).batchSetSupportLines(e), s.json({ success: true, message: `\u5DF2\u6279\u91CF\u8BBE\u7F6E ${e.length} \u4E2A\u652F\u6491\u7EBF` }));
  } catch (e) {
    return console.error("\u6279\u91CF\u8BBE\u7F6E\u652F\u6491\u7EBF\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/support-lines/clear", async (s) => {
  try {
    const t = await new be(s.env.DB).clearTodaySupportLines();
    return s.json({ success: true, message: `\u5DF2\u6E05\u96F6 ${t} \u4E2A\u652F\u6491\u7EBF`, count: t });
  } catch (e) {
    return console.error("\u6E05\u96F6\u652F\u6491\u7EBF\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.delete("/api/support-lines/:symbol", async (s) => {
  try {
    const e = s.req.param("symbol");
    return await new be(s.env.DB).deleteSupportLine(e), s.json({ success: true, message: `${e} \u7684\u652F\u6491\u7EBF\u5DF2\u5220\u9664` });
  } catch (e) {
    return console.error("\u5220\u9664\u652F\u6491\u7EBF\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/consecutive-rise/overview", async (s) => {
  try {
    const t = await new qe(s.env.DB).getStatsOverview();
    return s.json({ success: true, overview: t });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8FDE\u7EED\u4E0A\u6DA8\u7EDF\u8BA1\u6982\u89C8\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/consecutive-rise/all", async (s) => {
  try {
    const t = await new qe(s.env.DB).getAllStats();
    return s.json({ success: true, stats: t, count: t.length });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8FDE\u7EED\u4E0A\u6DA8\u7EDF\u8BA1\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.get("/api/consecutive-rise/above-threshold", async (s) => {
  try {
    const e = parseInt(s.req.query("threshold") || "20"), r = await new qe(s.env.DB).getCoinsAboveThreshold(e);
    return s.json({ success: true, threshold: e, coins: r, count: r.length });
  } catch (e) {
    return console.error("\u83B7\u53D6\u8FDE\u7EED\u4E0A\u6DA8\u7EDF\u8BA1\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/consecutive-rise/analyze-history", async (s) => {
  try {
    const e = s.req.query("timeframe") || "5m", t = parseInt(s.req.query("limit") || "1000"), o = await new qe(s.env.DB).analyzeHistoricalData(e, t);
    return s.json({ success: true, ...o });
  } catch (e) {
    return console.error("\u5206\u6790\u5386\u53F2\u6570\u636E\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
m.post("/api/consecutive-rise/update/:symbol", async (s) => {
  try {
    const e = s.req.param("symbol"), t = s.req.query("timeframe") || "5m";
    return await new qe(s.env.DB).updateSymbolKline(e, t), s.json({ success: true, message: `${e} \u7684\u8FDE\u7EED\u7EDF\u8BA1\u5DF2\u66F4\u65B0` });
  } catch (e) {
    return console.error("\u66F4\u65B0K\u7EBF\u7EDF\u8BA1\u5931\u8D25:", e), s.json({ success: false, error: e.message }, 500);
  }
});
var ft = new Vt();
var nr = Object.assign({ "/src/index.tsx": m });
var Zt = false;
for (const [, s] of Object.entries(nr)) s && (ft.all("*", (e) => {
  let t;
  try {
    t = e.executionCtx;
  } catch {
  }
  return s.fetch(e.req.raw, e.env, t);
}), ft.notFound((e) => {
  let t;
  try {
    t = e.executionCtx;
  } catch {
  }
  return s.fetch(e.req.raw, e.env, t);
}), Zt = true);
if (!Zt) throw new Error("Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-Nrkp7F/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = ft;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-Nrkp7F/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=bundledWorker-0.3091873206754354.mjs.map
