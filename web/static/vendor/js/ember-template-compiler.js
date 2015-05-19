/*!
 * @overview  Ember - JavaScript Application Framework
 * @copyright Copyright 2011-2015 Tilde Inc. and contributors
 *            Portions Copyright 2006-2011 Strobe Inc.
 *            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
 * @license   Licensed under MIT license
 *            See https://raw.github.com/emberjs/ember.js/master/LICENSE
 * @version   1.13.0-beta.1.ce345f0e
 */

(function() {
var enifed, requireModule, eriuqer, requirejs, Ember;
var mainContext = this;

(function() {

  Ember = this.Ember = this.Ember || {};
  if (typeof Ember === 'undefined') { Ember = {}; };

  if (typeof Ember.__loader === 'undefined') {
    var registry = {};
    var seen = {};

    enifed = function(name, deps, callback) {
      var value = { };

      if (!callback) {
        value.deps = [];
        value.callback = deps;
      } else {
        value.deps = deps;
        value.callback = callback;
      }

        registry[name] = value;
    };

    requirejs = eriuqer = requireModule = function(name) {
      return internalRequire(name, null);
    }

    function internalRequire(name, referrerName) {
      var exports = seen[name];

      if (exports !== undefined) {
        return exports;
      }

      exports = seen[name] = {};

      if (!registry[name]) {
        if (referrerName) {
          throw new Error('Could not find module ' + name + ' required by: ' + referrerName);
        } else {
          throw new Error('Could not find module ' + name);
        }
      }

      var mod = registry[name];
      var deps = mod.deps;
      var callback = mod.callback;
      var reified = [];
      var length = deps.length;

      for (var i=0; i<length; i++) {
        if (deps[i] === 'exports') {
          reified.push(exports);
        } else {
          reified.push(internalRequire(resolve(deps[i], name), name));
        }
      }

      callback.apply(this, reified);

      return exports;
    };

    function resolve(child, name) {
      if (child.charAt(0) !== '.') {
        return child;
      }
      var parts = child.split('/');
      var parentBase = name.split('/').slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') {
          parentBase.pop();
        } else if (part === '.') {
          continue;
        } else {
          parentBase.push(part);
        }
      }

      return parentBase.join('/');
    }

    requirejs._eak_seen = registry;

    Ember.__loader = {
      define: enifed,
      require: eriuqer,
      registry: registry
    };
  } else {
    enifed = Ember.__loader.define;
    requirejs = eriuqer = requireModule = Ember.__loader.require;
  }
})();

enifed('ember-debug', ['exports', 'ember-metal/core', 'ember-metal/error', 'ember-metal/logger', 'ember-metal/environment'], function (exports, Ember, EmberError, Logger, environment) {

  'use strict';

  exports._warnIfUsingStrippedFeatureFlags = _warnIfUsingStrippedFeatureFlags;

  /**
    Will call `Ember.warn()` if ENABLE_ALL_FEATURES, ENABLE_OPTIONAL_FEATURES, or
    any specific FEATURES flag is truthy.

    This method is called automatically in debug canary builds.

    @private
    @method _warnIfUsingStrippedFeatureFlags
    @return {void}
  */
  function isPlainFunction(test) {
    return typeof test === "function" && test.PrototypeMixin === undefined;
  }

  /**
    Define an assertion that will throw an exception if the condition is not
    met. Ember build tools will remove any calls to `Ember.assert()` when
    doing a production build. Example:

    ```javascript
    // Test for truthiness
    Ember.assert('Must pass a valid object', obj);

    // Fail unconditionally
    Ember.assert('This code path should never be run');
    ```

    @method assert
    @param {String} desc A description of the assertion. This will become
      the text of the Error thrown if the assertion fails.
    @param {Boolean|Function} test Must be truthy for the assertion to pass. If
      falsy, an exception will be thrown. If this is a function, it will be executed and
      its return value will be used as condition.
  */
  Ember['default'].assert = function (desc, test) {
    var throwAssertion;

    if (isPlainFunction(test)) {
      throwAssertion = !test();
    } else {
      throwAssertion = !test;
    }

    if (throwAssertion) {
      throw new EmberError['default']("Assertion Failed: " + desc);
    }
  };

  /**
    Display a warning with the provided message. Ember build tools will
    remove any calls to `Ember.warn()` when doing a production build.

    @method warn
    @param {String} message A warning to display.
    @param {Boolean} test An optional boolean. If falsy, the warning
      will be displayed.
  */
  Ember['default'].warn = function (message, test) {
    if (!test) {
      Logger['default'].warn("WARNING: " + message);
      if ("trace" in Logger['default']) {
        Logger['default'].trace();
      }
    }
  };

  /**
    Display a debug notice. Ember build tools will remove any calls to
    `Ember.debug()` when doing a production build.

    ```javascript
    Ember.debug('I\'m a debug notice!');
    ```

    @method debug
    @param {String} message A debug message to display.
  */
  Ember['default'].debug = function (message) {
    Logger['default'].debug("DEBUG: " + message);
  };

  /**
    Display a deprecation warning with the provided message and a stack trace
    (Chrome and Firefox only). Ember build tools will remove any calls to
    `Ember.deprecate()` when doing a production build.

    @method deprecate
    @param {String} message A description of the deprecation.
    @param {Boolean|Function} test An optional boolean. If falsy, the deprecation
      will be displayed. If this is a function, it will be executed and its return
      value will be used as condition.
    @param {Object} options An optional object that can be used to pass
      in a `url` to the transition guide on the emberjs.com website.
  */
  Ember['default'].deprecate = function (message, test, options) {
    var noDeprecation;

    if (isPlainFunction(test)) {
      noDeprecation = test();
    } else {
      noDeprecation = test;
    }

    if (noDeprecation) {
      return;
    }

    if (Ember['default'].ENV.RAISE_ON_DEPRECATION) {
      throw new EmberError['default'](message);
    }

    var error;

    // When using new Error, we can't do the arguments check for Chrome. Alternatives are welcome
    try {
      __fail__.fail();
    } catch (e) {
      error = e;
    }

    if (arguments.length === 3) {
      Ember['default'].assert("options argument to Ember.deprecate should be an object", options && typeof options === "object");
      if (options.url) {
        message += " See " + options.url + " for more details.";
      }
    }

    if (Ember['default'].LOG_STACKTRACE_ON_DEPRECATION && error.stack) {
      var stack;
      var stackStr = "";

      if (error["arguments"]) {
        // Chrome
        stack = error.stack.replace(/^\s+at\s+/gm, "").replace(/^([^\(]+?)([\n$])/gm, "{anonymous}($1)$2").replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, "{anonymous}($1)").split("\n");
        stack.shift();
      } else {
        // Firefox
        stack = error.stack.replace(/(?:\n@:0)?\s+$/m, "").replace(/^\(/gm, "{anonymous}(").split("\n");
      }

      stackStr = "\n    " + stack.slice(2).join("\n    ");
      message = message + stackStr;
    }

    Logger['default'].warn("DEPRECATION: " + message);
  };

  /**
    Alias an old, deprecated method with its new counterpart.

    Display a deprecation warning with the provided message and a stack trace
    (Chrome and Firefox only) when the assigned method is called.

    Ember build tools will not remove calls to `Ember.deprecateFunc()`, though
    no warnings will be shown in production.

    ```javascript
    Ember.oldMethod = Ember.deprecateFunc('Please use the new, updated method', Ember.newMethod);
    ```

    @method deprecateFunc
    @param {String} message A description of the deprecation.
    @param {Function} func The new function called to replace its deprecated counterpart.
    @return {Function} a new function that wrapped the original function with a deprecation warning
  */
  Ember['default'].deprecateFunc = function (message, func) {
    return function () {
      Ember['default'].deprecate(message);
      return func.apply(this, arguments);
    };
  };

  /**
    Run a function meant for debugging. Ember build tools will remove any calls to
    `Ember.runInDebug()` when doing a production build.

    ```javascript
    Ember.runInDebug(function() {
      Ember.Handlebars.EachView.reopen({
        didInsertElement: function() {
          console.log('I\'m happy');
        }
      });
    });
    ```

    @method runInDebug
    @param {Function} func The function to be executed.
    @since 1.5.0
  */
  Ember['default'].runInDebug = function (func) {
    func();
  };
  function _warnIfUsingStrippedFeatureFlags(FEATURES, featuresWereStripped) {
    if (featuresWereStripped) {
      Ember['default'].warn("Ember.ENV.ENABLE_ALL_FEATURES is only available in canary builds.", !Ember['default'].ENV.ENABLE_ALL_FEATURES);
      Ember['default'].warn("Ember.ENV.ENABLE_OPTIONAL_FEATURES is only available in canary builds.", !Ember['default'].ENV.ENABLE_OPTIONAL_FEATURES);

      for (var key in FEATURES) {
        if (FEATURES.hasOwnProperty(key) && key !== "isEnabled") {
          Ember['default'].warn("FEATURE[\"" + key + "\"] is set as enabled, but FEATURE flags are only available in canary builds.", !FEATURES[key]);
        }
      }
    }
  }

  if (!Ember['default'].testing) {
    // Complain if they're using FEATURE flags in builds other than canary
    Ember['default'].FEATURES["features-stripped-test"] = true;
    var featuresWereStripped = true;

    
    delete Ember['default'].FEATURES["features-stripped-test"];
    _warnIfUsingStrippedFeatureFlags(Ember['default'].ENV.FEATURES, featuresWereStripped);

    // Inform the developer about the Ember Inspector if not installed.
    var isFirefox = environment['default'].isFirefox;
    var isChrome = environment['default'].isChrome;

    if (typeof window !== "undefined" && (isFirefox || isChrome) && window.addEventListener) {
      window.addEventListener("load", function () {
        if (document.documentElement && document.documentElement.dataset && !document.documentElement.dataset.emberExtension) {
          var downloadURL;

          if (isChrome) {
            downloadURL = "https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi";
          } else if (isFirefox) {
            downloadURL = "https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/";
          }

          Ember['default'].debug("For more advanced debugging, install the Ember Inspector from " + downloadURL);
        }
      }, false);
    }
  }

  /*
    We are transitioning away from `ember.js` to `ember.debug.js` to make
    it much clearer that it is only for local development purposes.

    This flag value is changed by the tooling (by a simple string replacement)
    so that if `ember.js` (which must be output for backwards compat reasons) is
    used a nice helpful warning message will be printed out.
  */
  var runningNonEmberDebugJS = false;
  if (runningNonEmberDebugJS) {
    Ember['default'].warn("Please use `ember.debug.js` instead of `ember.js` for development and debugging.");
  }

  exports.runningNonEmberDebugJS = runningNonEmberDebugJS;

});
enifed('ember-metal', ['exports', 'ember-metal/core', 'ember-metal/merge', 'ember-metal/instrumentation', 'ember-metal/utils', 'ember-metal/error', 'ember-metal/enumerable_utils', 'ember-metal/cache', 'ember-metal/platform/define_property', 'ember-metal/platform/create', 'ember-metal/array', 'ember-metal/logger', 'ember-metal/property_get', 'ember-metal/events', 'ember-metal/observer_set', 'ember-metal/property_events', 'ember-metal/properties', 'ember-metal/property_set', 'ember-metal/map', 'ember-metal/get_properties', 'ember-metal/set_properties', 'ember-metal/watch_key', 'ember-metal/chains', 'ember-metal/watch_path', 'ember-metal/watching', 'ember-metal/expand_properties', 'ember-metal/computed', 'ember-metal/alias', 'ember-metal/computed_macros', 'ember-metal/observer', 'ember-metal/mixin', 'ember-metal/binding', 'ember-metal/run_loop', 'ember-metal/libraries', 'ember-metal/is_none', 'ember-metal/is_empty', 'ember-metal/is_blank', 'ember-metal/is_present', 'ember-metal/keys', 'backburner', 'ember-metal/streams/utils', 'ember-metal/streams/stream'], function (exports, Ember, merge, instrumentation, utils, EmberError, EnumerableUtils, Cache, define_property, create, array, Logger, property_get, events, ObserverSet, property_events, properties, property_set, map, getProperties, setProperties, watch_key, chains, watch_path, watching, expandProperties, computed, alias, computed_macros, observer, mixin, binding, run, Libraries, isNone, isEmpty, isBlank, isPresent, keys, Backburner, streams__utils, Stream) {

  'use strict';

  /**
  Ember Metal

  @module ember
  @submodule ember-metal
  */

  // BEGIN IMPORTS
  computed.computed.empty = computed_macros.empty;
  computed.computed.notEmpty = computed_macros.notEmpty;
  computed.computed.none = computed_macros.none;
  computed.computed.not = computed_macros.not;
  computed.computed.bool = computed_macros.bool;
  computed.computed.match = computed_macros.match;
  computed.computed.equal = computed_macros.equal;
  computed.computed.gt = computed_macros.gt;
  computed.computed.gte = computed_macros.gte;
  computed.computed.lt = computed_macros.lt;
  computed.computed.lte = computed_macros.lte;
  computed.computed.alias = alias['default'];
  computed.computed.oneWay = computed_macros.oneWay;
  computed.computed.reads = computed_macros.oneWay;
  computed.computed.readOnly = computed_macros.readOnly;
  computed.computed.defaultTo = computed_macros.defaultTo;
  computed.computed.deprecatingAlias = computed_macros.deprecatingAlias;
  computed.computed.and = computed_macros.and;
  computed.computed.or = computed_macros.or;
  computed.computed.any = computed_macros.any;
  computed.computed.collect = computed_macros.collect; // END IMPORTS

  // BEGIN EXPORTS
  var EmberInstrumentation = Ember['default'].Instrumentation = {};
  EmberInstrumentation.instrument = instrumentation.instrument;
  EmberInstrumentation.subscribe = instrumentation.subscribe;
  EmberInstrumentation.unsubscribe = instrumentation.unsubscribe;
  EmberInstrumentation.reset = instrumentation.reset;

  Ember['default'].instrument = instrumentation.instrument;
  Ember['default'].subscribe = instrumentation.subscribe;

  Ember['default']._Cache = Cache['default'];

  Ember['default'].generateGuid = utils.generateGuid;
  Ember['default'].GUID_KEY = utils.GUID_KEY;
  Ember['default'].create = create['default'];
  Ember['default'].keys = keys['default'];
  Ember['default'].platform = {
    defineProperty: properties.defineProperty,
    hasPropertyAccessors: define_property.hasPropertyAccessors
  };

  var EmberArrayPolyfills = Ember['default'].ArrayPolyfills = {};

  EmberArrayPolyfills.map = array.map;
  EmberArrayPolyfills.forEach = array.forEach;
  EmberArrayPolyfills.filter = array.filter;
  EmberArrayPolyfills.indexOf = array.indexOf;

  Ember['default'].Error = EmberError['default'];
  Ember['default'].guidFor = utils.guidFor;
  Ember['default'].META_DESC = utils.META_DESC;
  Ember['default'].EMPTY_META = utils.EMPTY_META;
  Ember['default'].meta = utils.meta;
  Ember['default'].getMeta = utils.getMeta;
  Ember['default'].setMeta = utils.setMeta;
  Ember['default'].metaPath = utils.metaPath;
  Ember['default'].inspect = utils.inspect;
  Ember['default'].tryCatchFinally = utils.deprecatedTryCatchFinally;
  Ember['default'].makeArray = utils.makeArray;
  Ember['default'].canInvoke = utils.canInvoke;
  Ember['default'].tryInvoke = utils.tryInvoke;
  Ember['default'].tryFinally = utils.deprecatedTryFinally;
  Ember['default'].wrap = utils.wrap;
  Ember['default'].apply = utils.apply;
  Ember['default'].applyStr = utils.applyStr;
  Ember['default'].uuid = utils.uuid;

  Ember['default'].Logger = Logger['default'];

  Ember['default'].get = property_get.get;
  Ember['default'].getWithDefault = property_get.getWithDefault;
  Ember['default'].normalizeTuple = property_get.normalizeTuple;
  Ember['default']._getPath = property_get._getPath;

  Ember['default'].EnumerableUtils = EnumerableUtils['default'];

  Ember['default'].on = events.on;
  Ember['default'].addListener = events.addListener;
  Ember['default'].removeListener = events.removeListener;
  Ember['default']._suspendListener = events.suspendListener;
  Ember['default']._suspendListeners = events.suspendListeners;
  Ember['default'].sendEvent = events.sendEvent;
  Ember['default'].hasListeners = events.hasListeners;
  Ember['default'].watchedEvents = events.watchedEvents;
  Ember['default'].listenersFor = events.listenersFor;
  Ember['default'].accumulateListeners = events.accumulateListeners;

  Ember['default']._ObserverSet = ObserverSet['default'];

  Ember['default'].propertyWillChange = property_events.propertyWillChange;
  Ember['default'].propertyDidChange = property_events.propertyDidChange;
  Ember['default'].overrideChains = property_events.overrideChains;
  Ember['default'].beginPropertyChanges = property_events.beginPropertyChanges;
  Ember['default'].endPropertyChanges = property_events.endPropertyChanges;
  Ember['default'].changeProperties = property_events.changeProperties;

  Ember['default'].defineProperty = properties.defineProperty;

  Ember['default'].set = property_set.set;
  Ember['default'].trySet = property_set.trySet;

  Ember['default'].OrderedSet = map.OrderedSet;
  Ember['default'].Map = map.Map;
  Ember['default'].MapWithDefault = map.MapWithDefault;

  Ember['default'].getProperties = getProperties['default'];
  Ember['default'].setProperties = setProperties['default'];

  Ember['default'].watchKey = watch_key.watchKey;
  Ember['default'].unwatchKey = watch_key.unwatchKey;

  Ember['default'].flushPendingChains = chains.flushPendingChains;
  Ember['default'].removeChainWatcher = chains.removeChainWatcher;
  Ember['default']._ChainNode = chains.ChainNode;
  Ember['default'].finishChains = chains.finishChains;

  Ember['default'].watchPath = watch_path.watchPath;
  Ember['default'].unwatchPath = watch_path.unwatchPath;

  Ember['default'].watch = watching.watch;
  Ember['default'].isWatching = watching.isWatching;
  Ember['default'].unwatch = watching.unwatch;
  Ember['default'].rewatch = watching.rewatch;
  Ember['default'].destroy = watching.destroy;

  Ember['default'].expandProperties = expandProperties['default'];

  Ember['default'].ComputedProperty = computed.ComputedProperty;
  Ember['default'].computed = computed.computed;
  Ember['default'].cacheFor = computed.cacheFor;

  Ember['default'].addObserver = observer.addObserver;
  Ember['default'].observersFor = observer.observersFor;
  Ember['default'].removeObserver = observer.removeObserver;
  Ember['default'].addBeforeObserver = observer.addBeforeObserver;
  Ember['default']._suspendBeforeObserver = observer._suspendBeforeObserver;
  Ember['default']._suspendBeforeObservers = observer._suspendBeforeObservers;
  Ember['default']._suspendObserver = observer._suspendObserver;
  Ember['default']._suspendObservers = observer._suspendObservers;
  Ember['default'].beforeObserversFor = observer.beforeObserversFor;
  Ember['default'].removeBeforeObserver = observer.removeBeforeObserver;

  Ember['default'].IS_BINDING = mixin.IS_BINDING;
  Ember['default'].required = mixin.required;
  Ember['default'].aliasMethod = mixin.aliasMethod;
  Ember['default'].observer = mixin.observer;
  Ember['default'].immediateObserver = mixin.immediateObserver;
  Ember['default'].beforeObserver = mixin.beforeObserver;
  Ember['default'].mixin = mixin.mixin;
  Ember['default'].Mixin = mixin.Mixin;

  Ember['default'].oneWay = binding.oneWay;
  Ember['default'].bind = binding.bind;
  Ember['default'].Binding = binding.Binding;
  Ember['default'].isGlobalPath = binding.isGlobalPath;

  Ember['default'].run = run['default'];

  /**
   * @class Backburner
   * @for Ember
   * @private
  */
  Ember['default'].Backburner = Backburner['default'];

  Ember['default'].libraries = new Libraries['default']();
  Ember['default'].libraries.registerCoreLibrary("Ember", Ember['default'].VERSION);

  Ember['default'].isNone = isNone['default'];
  Ember['default'].isEmpty = isEmpty['default'];
  Ember['default'].isBlank = isBlank['default'];
  Ember['default'].isPresent = isPresent['default'];

  Ember['default'].merge = merge['default'];

  
  /**
    A function may be assigned to `Ember.onerror` to be called when Ember
    internals encounter an error. This is useful for specialized error handling
    and reporting code.

    ```javascript
    Ember.onerror = function(error) {
      Em.$.ajax('/report-error', 'POST', {
        stack: error.stack,
        otherInformation: 'whatever app state you want to provide'
      });
    };
    ```

    Internally, `Ember.onerror` is used as Backburner's error handler.

    @event onerror
    @for Ember
    @param {Exception} error the error object
  */
  Ember['default'].onerror = null;
  // END EXPORTS

  // do this for side-effects of updating Ember.assert, warn, etc when
  // ember-debug is present
  if (Ember['default'].__loader.registry["ember-debug"]) {
    requireModule("ember-debug");
  }

  exports['default'] = Ember['default'];

});
enifed('ember-metal/alias', ['exports', 'ember-metal/property_get', 'ember-metal/property_set', 'ember-metal/core', 'ember-metal/error', 'ember-metal/properties', 'ember-metal/computed', 'ember-metal/platform/create', 'ember-metal/utils', 'ember-metal/dependent_keys'], function (exports, property_get, property_set, Ember, EmberError, properties, computed, create, utils, dependent_keys) {

  'use strict';

  exports.AliasedProperty = AliasedProperty;

  exports['default'] = alias;

  function alias(altKey) {
    return new AliasedProperty(altKey);
  }

  function AliasedProperty(altKey) {
    this.isDescriptor = true;
    this.altKey = altKey;
    this._dependentKeys = [altKey];
  }

  AliasedProperty.prototype = create['default'](properties.Descriptor.prototype);

  AliasedProperty.prototype.get = function AliasedProperty_get(obj, keyName) {
    return property_get.get(obj, this.altKey);
  };

  AliasedProperty.prototype.set = function AliasedProperty_set(obj, keyName, value) {
    return property_set.set(obj, this.altKey, value);
  };

  AliasedProperty.prototype.willWatch = function (obj, keyName) {
    dependent_keys.addDependentKeys(this, obj, keyName, utils.meta(obj));
  };

  AliasedProperty.prototype.didUnwatch = function (obj, keyName) {
    dependent_keys.removeDependentKeys(this, obj, keyName, utils.meta(obj));
  };

  AliasedProperty.prototype.setup = function (obj, keyName) {
    Ember['default'].assert("Setting alias '" + keyName + "' on self", this.altKey !== keyName);
    var m = utils.meta(obj);
    if (m.watching[keyName]) {
      dependent_keys.addDependentKeys(this, obj, keyName, m);
    }
  };

  AliasedProperty.prototype.teardown = function (obj, keyName) {
    var m = utils.meta(obj);
    if (m.watching[keyName]) {
      dependent_keys.removeDependentKeys(this, obj, keyName, m);
    }
  };

  AliasedProperty.prototype.readOnly = function () {
    this.set = AliasedProperty_readOnlySet;
    return this;
  };

  function AliasedProperty_readOnlySet(obj, keyName, value) {
    throw new EmberError['default']("Cannot set read-only property '" + keyName + "' on object: " + utils.inspect(obj));
  }

  AliasedProperty.prototype.oneWay = function () {
    this.set = AliasedProperty_oneWaySet;
    return this;
  };

  function AliasedProperty_oneWaySet(obj, keyName, value) {
    properties.defineProperty(obj, keyName, null);
    return property_set.set(obj, keyName, value);
  }

  // Backwards compatibility with Ember Data
  AliasedProperty.prototype._meta = undefined;
  AliasedProperty.prototype.meta = computed.ComputedProperty.prototype.meta;

});
enifed('ember-metal/array', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember-metal
  */

  var ArrayPrototype = Array.prototype;

  // Testing this is not ideal, but we want to use native functions
  // if available, but not to use versions created by libraries like Prototype
  var isNativeFunc = function (func) {
    // This should probably work in all browsers likely to have ES5 array methods
    return func && Function.prototype.toString.call(func).indexOf("[native code]") > -1;
  };

  var defineNativeShim = function (nativeFunc, shim) {
    if (isNativeFunc(nativeFunc)) {
      return nativeFunc;
    }
    return shim;
  };

  // From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/map
  var map = defineNativeShim(ArrayPrototype.map, function (fun) {
    //"use strict";

    if (this === void 0 || this === null || typeof fun !== "function") {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    var res = new Array(len);

    for (var i = 0; i < len; i++) {
      if (i in t) {
        res[i] = fun.call(arguments[1], t[i], i, t);
      }
    }

    return res;
  });

  // From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
  var forEach = defineNativeShim(ArrayPrototype.forEach, function (fun) {
    //"use strict";

    if (this === void 0 || this === null || typeof fun !== "function") {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;

    for (var i = 0; i < len; i++) {
      if (i in t) {
        fun.call(arguments[1], t[i], i, t);
      }
    }
  });

  var indexOf = defineNativeShim(ArrayPrototype.indexOf, function (obj, fromIndex) {
    if (fromIndex === null || fromIndex === undefined) {
      fromIndex = 0;
    } else if (fromIndex < 0) {
      fromIndex = Math.max(0, this.length + fromIndex);
    }

    for (var i = fromIndex, j = this.length; i < j; i++) {
      if (this[i] === obj) {
        return i;
      }
    }
    return -1;
  });

  var lastIndexOf = defineNativeShim(ArrayPrototype.lastIndexOf, function (obj, fromIndex) {
    var len = this.length;
    var idx;

    if (fromIndex === undefined) {
      fromIndex = len - 1;
    } else {
      fromIndex = fromIndex < 0 ? Math.ceil(fromIndex) : Math.floor(fromIndex);
    }

    if (fromIndex < 0) {
      fromIndex += len;
    }

    for (idx = fromIndex; idx >= 0; idx--) {
      if (this[idx] === obj) {
        return idx;
      }
    }
    return -1;
  });

  var filter = defineNativeShim(ArrayPrototype.filter, function (fn, context) {
    var i, value;
    var result = [];
    var length = this.length;

    for (i = 0; i < length; i++) {
      if (this.hasOwnProperty(i)) {
        value = this[i];
        if (fn.call(context, value, i, this)) {
          result.push(value);
        }
      }
    }
    return result;
  });

  if (Ember.SHIM_ES5) {
    ArrayPrototype.map = ArrayPrototype.map || map;
    ArrayPrototype.forEach = ArrayPrototype.forEach || forEach;
    ArrayPrototype.filter = ArrayPrototype.filter || filter;
    ArrayPrototype.indexOf = ArrayPrototype.indexOf || indexOf;
    ArrayPrototype.lastIndexOf = ArrayPrototype.lastIndexOf || lastIndexOf;
  }

  /**
    Array polyfills to support ES5 features in older browsers.

    @namespace Ember
    @property ArrayPolyfills
  */

  exports.map = map;
  exports.forEach = forEach;
  exports.filter = filter;
  exports.indexOf = indexOf;
  exports.lastIndexOf = lastIndexOf;

});
enifed('ember-metal/binding', ['exports', 'ember-metal/core', 'ember-metal/property_get', 'ember-metal/property_set', 'ember-metal/utils', 'ember-metal/observer', 'ember-metal/run_loop', 'ember-metal/path_cache'], function (exports, Ember, property_get, property_set, utils, observer, run, path_cache) {

  'use strict';

  exports.bind = bind;
  exports.oneWay = oneWay;
  exports.Binding = Binding;

  /**
    An `Ember.Binding` connects the properties of two objects so that whenever
    the value of one property changes, the other property will be changed also.

    ## Automatic Creation of Bindings with `/^*Binding/`-named Properties

    You do not usually create Binding objects directly but instead describe
    bindings in your class or object definition using automatic binding
    detection.

    Properties ending in a `Binding` suffix will be converted to `Ember.Binding`
    instances. The value of this property should be a string representing a path
    to another object or a custom binding instance created using Binding helpers
    (see "One Way Bindings"):

    ```
    valueBinding: "MyApp.someController.title"
    ```

    This will create a binding from `MyApp.someController.title` to the `value`
    property of your object instance automatically. Now the two values will be
    kept in sync.

    ## One Way Bindings

    One especially useful binding customization you can use is the `oneWay()`
    helper. This helper tells Ember that you are only interested in
    receiving changes on the object you are binding from. For example, if you
    are binding to a preference and you want to be notified if the preference
    has changed, but your object will not be changing the preference itself, you
    could do:

    ```
    bigTitlesBinding: Ember.Binding.oneWay("MyApp.preferencesController.bigTitles")
    ```

    This way if the value of `MyApp.preferencesController.bigTitles` changes the
    `bigTitles` property of your object will change also. However, if you
    change the value of your `bigTitles` property, it will not update the
    `preferencesController`.

    One way bindings are almost twice as fast to setup and twice as fast to
    execute because the binding only has to worry about changes to one side.

    You should consider using one way bindings anytime you have an object that
    may be created frequently and you do not intend to change a property; only
    to monitor it for changes (such as in the example above).

    ## Adding Bindings Manually

    All of the examples above show you how to configure a custom binding, but the
    result of these customizations will be a binding template, not a fully active
    Binding instance. The binding will actually become active only when you
    instantiate the object the binding belongs to. It is useful however, to
    understand what actually happens when the binding is activated.

    For a binding to function it must have at least a `from` property and a `to`
    property. The `from` property path points to the object/key that you want to
    bind from while the `to` path points to the object/key you want to bind to.

    When you define a custom binding, you are usually describing the property
    you want to bind from (such as `MyApp.someController.value` in the examples
    above). When your object is created, it will automatically assign the value
    you want to bind `to` based on the name of your binding key. In the
    examples above, during init, Ember objects will effectively call
    something like this on your binding:

    ```javascript
    binding = Ember.Binding.from("valueBinding").to("value");
    ```

    This creates a new binding instance based on the template you provide, and
    sets the to path to the `value` property of the new object. Now that the
    binding is fully configured with a `from` and a `to`, it simply needs to be
    connected to become active. This is done through the `connect()` method:

    ```javascript
    binding.connect(this);
    ```

    Note that when you connect a binding you pass the object you want it to be
    connected to. This object will be used as the root for both the from and
    to side of the binding when inspecting relative paths. This allows the
    binding to be automatically inherited by subclassed objects as well.

    This also allows you to bind between objects using the paths you declare in
    `from` and `to`:

    ```javascript
    // Example 1
    binding = Ember.Binding.from("App.someObject.value").to("value");
    binding.connect(this);

    // Example 2
    binding = Ember.Binding.from("parentView.value").to("App.someObject.value");
    binding.connect(this);
    ```

    Now that the binding is connected, it will observe both the from and to side
    and relay changes.

    If you ever needed to do so (you almost never will, but it is useful to
    understand this anyway), you could manually create an active binding by
    using the `Ember.bind()` helper method. (This is the same method used by
    to setup your bindings on objects):

    ```javascript
    Ember.bind(MyApp.anotherObject, "value", "MyApp.someController.value");
    ```

    Both of these code fragments have the same effect as doing the most friendly
    form of binding creation like so:

    ```javascript
    MyApp.anotherObject = Ember.Object.create({
      valueBinding: "MyApp.someController.value",

      // OTHER CODE FOR THIS OBJECT...
    });
    ```

    Ember's built in binding creation method makes it easy to automatically
    create bindings for you. You should always use the highest-level APIs
    available, even if you understand how it works underneath.

    @class Binding
    @namespace Ember
    @since Ember 0.9
  */
  // Ember.Binding = Binding; ES6TODO: where to put this?

  /**
    Global helper method to create a new binding. Just pass the root object
    along with a `to` and `from` path to create and connect the binding.

    @method bind
    @for Ember
    @param {Object} obj The root object of the transform.
    @param {String} to The path to the 'to' side of the binding.
      Must be relative to obj.
    @param {String} from The path to the 'from' side of the binding.
      Must be relative to obj or a global path.
    @return {Ember.Binding} binding instance
  */
  Ember['default'].LOG_BINDINGS = false || !!Ember['default'].ENV.LOG_BINDINGS;

  /**
    Returns true if the provided path is global (e.g., `MyApp.fooController.bar`)
    instead of local (`foo.bar.baz`).

    @method isGlobalPath
    @for Ember
    @private
    @param {String} path
    @return Boolean
  */

  function getWithGlobals(obj, path) {
    return property_get.get(path_cache.isGlobal(path) ? Ember['default'].lookup : obj, path);
  }

  // ..........................................................
  // BINDING
  //

  function Binding(toPath, fromPath) {
    this._direction = undefined;
    this._from = fromPath;
    this._to = toPath;
    this._readyToSync = undefined;
    this._oneWay = undefined;
  }

  /**
  @class Binding
  @namespace Ember
  */

  Binding.prototype = {
    /**
      This copies the Binding so it can be connected to another object.
       @method copy
      @return {Ember.Binding} `this`
    */
    copy: function () {
      var copy = new Binding(this._to, this._from);
      if (this._oneWay) {
        copy._oneWay = true;
      }
      return copy;
    },

    // ..........................................................
    // CONFIG
    //

    /**
      This will set `from` property path to the specified value. It will not
      attempt to resolve this property path to an actual object until you
      connect the binding.
       The binding will search for the property path starting at the root object
      you pass when you `connect()` the binding. It follows the same rules as
      `get()` - see that method for more information.
       @method from
      @param {String} path the property path to connect to
      @return {Ember.Binding} `this`
    */
    from: function (path) {
      this._from = path;
      return this;
    },

    /**
      This will set the `to` property path to the specified value. It will not
      attempt to resolve this property path to an actual object until you
      connect the binding.
       The binding will search for the property path starting at the root object
      you pass when you `connect()` the binding. It follows the same rules as
      `get()` - see that method for more information.
       @method to
      @param {String|Tuple} path A property path or tuple
      @return {Ember.Binding} `this`
    */
    to: function (path) {
      this._to = path;
      return this;
    },

    /**
      Configures the binding as one way. A one-way binding will relay changes
      on the `from` side to the `to` side, but not the other way around. This
      means that if you change the `to` side directly, the `from` side may have
      a different value.
       @method oneWay
      @return {Ember.Binding} `this`
    */
    oneWay: function () {
      this._oneWay = true;
      return this;
    },

    /**
      @method toString
      @return {String} string representation of binding
    */
    toString: function () {
      var oneWay = this._oneWay ? "[oneWay]" : "";
      return "Ember.Binding<" + utils.guidFor(this) + ">(" + this._from + " -> " + this._to + ")" + oneWay;
    },

    // ..........................................................
    // CONNECT AND SYNC
    //

    /**
      Attempts to connect this binding instance so that it can receive and relay
      changes. This method will raise an exception if you have not set the
      from/to properties yet.
       @method connect
      @param {Object} obj The root object for this binding.
      @return {Ember.Binding} `this`
    */
    connect: function (obj) {
      Ember['default'].assert("Must pass a valid object to Ember.Binding.connect()", !!obj);

      var fromPath = this._from;
      var toPath = this._to;
      property_set.trySet(obj, toPath, getWithGlobals(obj, fromPath));

      // add an observer on the object to be notified when the binding should be updated
      observer.addObserver(obj, fromPath, this, this.fromDidChange);

      // if the binding is a two-way binding, also set up an observer on the target
      if (!this._oneWay) {
        observer.addObserver(obj, toPath, this, this.toDidChange);
      }

      this._readyToSync = true;

      return this;
    },

    /**
      Disconnects the binding instance. Changes will no longer be relayed. You
      will not usually need to call this method.
       @method disconnect
      @param {Object} obj The root object you passed when connecting the binding.
      @return {Ember.Binding} `this`
    */
    disconnect: function (obj) {
      Ember['default'].assert("Must pass a valid object to Ember.Binding.disconnect()", !!obj);

      var twoWay = !this._oneWay;

      // remove an observer on the object so we're no longer notified of
      // changes that should update bindings.
      observer.removeObserver(obj, this._from, this, this.fromDidChange);

      // if the binding is two-way, remove the observer from the target as well
      if (twoWay) {
        observer.removeObserver(obj, this._to, this, this.toDidChange);
      }

      this._readyToSync = false; // disable scheduled syncs...
      return this;
    },

    // ..........................................................
    // PRIVATE
    //

    /* called when the from side changes */
    fromDidChange: function (target) {
      this._scheduleSync(target, "fwd");
    },

    /* called when the to side changes */
    toDidChange: function (target) {
      this._scheduleSync(target, "back");
    },

    _scheduleSync: function (obj, dir) {
      var existingDir = this._direction;

      // if we haven't scheduled the binding yet, schedule it
      if (existingDir === undefined) {
        run['default'].schedule("sync", this, this._sync, obj);
        this._direction = dir;
      }

      // If both a 'back' and 'fwd' sync have been scheduled on the same object,
      // default to a 'fwd' sync so that it remains deterministic.
      if (existingDir === "back" && dir === "fwd") {
        this._direction = "fwd";
      }
    },

    _sync: function (obj) {
      var log = Ember['default'].LOG_BINDINGS;

      // don't synchronize destroyed objects or disconnected bindings
      if (obj.isDestroyed || !this._readyToSync) {
        return;
      }

      // get the direction of the binding for the object we are
      // synchronizing from
      var direction = this._direction;

      var fromPath = this._from;
      var toPath = this._to;

      this._direction = undefined;

      // if we're synchronizing from the remote object...
      if (direction === "fwd") {
        var fromValue = getWithGlobals(obj, this._from);
        if (log) {
          Ember['default'].Logger.log(" ", this.toString(), "->", fromValue, obj);
        }
        if (this._oneWay) {
          property_set.trySet(obj, toPath, fromValue);
        } else {
          observer._suspendObserver(obj, toPath, this, this.toDidChange, function () {
            property_set.trySet(obj, toPath, fromValue);
          });
        }
        // if we're synchronizing *to* the remote object
      } else if (direction === "back") {
        var toValue = property_get.get(obj, this._to);
        if (log) {
          Ember['default'].Logger.log(" ", this.toString(), "<-", toValue, obj);
        }
        observer._suspendObserver(obj, fromPath, this, this.fromDidChange, function () {
          property_set.trySet(path_cache.isGlobal(fromPath) ? Ember['default'].lookup : obj, fromPath, toValue);
        });
      }
    }

  };

  function mixinProperties(to, from) {
    for (var key in from) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
  }

  mixinProperties(Binding, {

    /*
      See `Ember.Binding.from`.
       @method from
      @static
    */
    from: function (from) {
      var C = this;
      return new C(undefined, from);
    },

    /*
      See `Ember.Binding.to`.
       @method to
      @static
    */
    to: function (to) {
      var C = this;
      return new C(to, undefined);
    },

    /**
      Creates a new Binding instance and makes it apply in a single direction.
      A one-way binding will relay changes on the `from` side object (supplied
      as the `from` argument) the `to` side, but not the other way around.
      This means that if you change the "to" side directly, the "from" side may have
      a different value.
       See `Binding.oneWay`.
       @method oneWay
      @param {String} from from path.
      @param {Boolean} [flag] (Optional) passing nothing here will make the
        binding `oneWay`. You can instead pass `false` to disable `oneWay`, making the
        binding two way again.
      @return {Ember.Binding} `this`
    */
    oneWay: function (from, flag) {
      var C = this;
      return new C(undefined, from).oneWay(flag);
    }

  });
  function bind(obj, to, from) {
    return new Binding(to, from).connect(obj);
  }

  function oneWay(obj, to, from) {
    return new Binding(to, from).oneWay().connect(obj);
  }

  exports.isGlobalPath = path_cache.isGlobal;

});
enifed('ember-metal/cache', ['exports', 'ember-metal/dictionary'], function (exports, dictionary) {

  'use strict';

  exports['default'] = Cache;

  function Cache(limit, func) {
    this.store = dictionary['default'](null);
    this.size = 0;
    this.misses = 0;
    this.hits = 0;
    this.limit = limit;
    this.func = func;
  }

  var UNDEFINED = function () {};

  Cache.prototype = {
    set: function (key, value) {
      if (this.limit > this.size) {
        this.size++;
        if (value === undefined) {
          this.store[key] = UNDEFINED;
        } else {
          this.store[key] = value;
        }
      }

      return value;
    },

    get: function (key) {
      var value = this.store[key];

      if (value === undefined) {
        this.misses++;
        value = this.set(key, this.func(key));
      } else if (value === UNDEFINED) {
        this.hits++;
        value = undefined;
      } else {
        this.hits++;
        // nothing to translate
      }

      return value;
    },

    purge: function () {
      this.store = dictionary['default'](null);
      this.size = 0;
      this.hits = 0;
      this.misses = 0;
    }
  };

});
enifed('ember-metal/chains', ['exports', 'ember-metal/core', 'ember-metal/property_get', 'ember-metal/utils', 'ember-metal/array', 'ember-metal/watch_key'], function (exports, Ember, property_get, utils, array, watch_key) {

  'use strict';

  exports.flushPendingChains = flushPendingChains;
  exports.finishChains = finishChains;
  exports.removeChainWatcher = removeChainWatcher;
  exports.ChainNode = ChainNode;

  // attempts to add the pendingQueue chains again. If some of them end up
  // back in the queue and reschedule is true, schedules a timeout to try
  // again.
  var warn = Ember['default'].warn;
  var FIRST_KEY = /^([^\.]+)/;

  function firstKey(path) {
    return path.match(FIRST_KEY)[0];
  }

  function isObject(obj) {
    return obj && typeof obj === "object";
  }

  var pendingQueue = [];
  function flushPendingChains() {
    if (pendingQueue.length === 0) {
      return;
    }

    var queue = pendingQueue;
    pendingQueue = [];

    array.forEach.call(queue, function (q) {
      q[0].add(q[1]);
    });

    warn("Watching an undefined global, Ember expects watched globals to be" + " setup by the time the run loop is flushed, check for typos", pendingQueue.length === 0);
  }

  function addChainWatcher(obj, keyName, node) {
    if (!isObject(obj)) {
      return;
    }

    var m = utils.meta(obj);
    var nodes = m.chainWatchers;

    if (!m.hasOwnProperty("chainWatchers")) {
      // FIXME?!
      nodes = m.chainWatchers = {};
    }

    if (!nodes[keyName]) {
      nodes[keyName] = [];
    }
    nodes[keyName].push(node);
    watch_key.watchKey(obj, keyName, m);
  }

  function removeChainWatcher(obj, keyName, node) {
    if (!isObject(obj)) {
      return;
    }

    var m = obj["__ember_meta__"];
    if (m && !m.hasOwnProperty("chainWatchers")) {
      return;
    } // nothing to do

    var nodes = m && m.chainWatchers;

    if (nodes && nodes[keyName]) {
      nodes = nodes[keyName];
      for (var i = 0, l = nodes.length; i < l; i++) {
        if (nodes[i] === node) {
          nodes.splice(i, 1);
          break;
        }
      }
    }
    watch_key.unwatchKey(obj, keyName, m);
  }

  // A ChainNode watches a single key on an object. If you provide a starting
  // value for the key then the node won't actually watch it. For a root node
  // pass null for parent and key and object for value.
  function ChainNode(parent, key, value) {
    this._parent = parent;
    this._key = key;

    // _watching is true when calling get(this._parent, this._key) will
    // return the value of this node.
    //
    // It is false for the root of a chain (because we have no parent)
    // and for global paths (because the parent node is the object with
    // the observer on it)
    this._watching = value === undefined;

    this._value = value;
    this._paths = {};
    if (this._watching) {
      this._object = parent.value();
      if (this._object) {
        addChainWatcher(this._object, this._key, this);
      }
    }

    // Special-case: the EachProxy relies on immediate evaluation to
    // establish its observers.
    //
    // TODO: Replace this with an efficient callback that the EachProxy
    // can implement.
    if (this._parent && this._parent._key === "@each") {
      this.value();
    }
  }

  function lazyGet(obj, key) {
    if (!obj) {
      return;
    }

    var meta = obj["__ember_meta__"];
    // check if object meant only to be a prototype
    if (meta && meta.proto === obj) {
      return;
    }

    if (key === "@each") {
      return property_get.get(obj, key);
    }

    // if a CP only return cached value
    var possibleDesc = obj[key];
    var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;
    if (desc && desc._cacheable) {
      if (meta.cache && key in meta.cache) {
        return meta.cache[key];
      } else {
        return;
      }
    }

    return property_get.get(obj, key);
  }

  ChainNode.prototype = {
    value: function () {
      if (this._value === undefined && this._watching) {
        var obj = this._parent.value();
        this._value = lazyGet(obj, this._key);
      }
      return this._value;
    },

    destroy: function () {
      if (this._watching) {
        var obj = this._object;
        if (obj) {
          removeChainWatcher(obj, this._key, this);
        }
        this._watching = false; // so future calls do nothing
      }
    },

    // copies a top level object only
    copy: function (obj) {
      var ret = new ChainNode(null, null, obj);
      var paths = this._paths;
      var path;

      for (path in paths) {
        // this check will also catch non-number vals.
        if (paths[path] <= 0) {
          continue;
        }
        ret.add(path);
      }
      return ret;
    },

    // called on the root node of a chain to setup watchers on the specified
    // path.
    add: function (path) {
      var obj, tuple, key, src, paths;

      paths = this._paths;
      paths[path] = (paths[path] || 0) + 1;

      obj = this.value();
      tuple = property_get.normalizeTuple(obj, path);

      // the path was a local path
      if (tuple[0] && tuple[0] === obj) {
        path = tuple[1];
        key = firstKey(path);
        path = path.slice(key.length + 1);

        // global path, but object does not exist yet.
        // put into a queue and try to connect later.
      } else if (!tuple[0]) {
        pendingQueue.push([this, path]);
        tuple.length = 0;
        return;

        // global path, and object already exists
      } else {
        src = tuple[0];
        key = path.slice(0, 0 - (tuple[1].length + 1));
        path = tuple[1];
      }

      tuple.length = 0;
      this.chain(key, path, src);
    },

    // called on the root node of a chain to teardown watcher on the specified
    // path
    remove: function (path) {
      var obj, tuple, key, src, paths;

      paths = this._paths;
      if (paths[path] > 0) {
        paths[path]--;
      }

      obj = this.value();
      tuple = property_get.normalizeTuple(obj, path);
      if (tuple[0] === obj) {
        path = tuple[1];
        key = firstKey(path);
        path = path.slice(key.length + 1);
      } else {
        src = tuple[0];
        key = path.slice(0, 0 - (tuple[1].length + 1));
        path = tuple[1];
      }

      tuple.length = 0;
      this.unchain(key, path);
    },

    count: 0,

    chain: function (key, path, src) {
      var chains = this._chains;
      var node;
      if (!chains) {
        chains = this._chains = {};
      }

      node = chains[key];
      if (!node) {
        node = chains[key] = new ChainNode(this, key, src);
      }
      node.count++; // count chains...

      // chain rest of path if there is one
      if (path) {
        key = firstKey(path);
        path = path.slice(key.length + 1);
        node.chain(key, path); // NOTE: no src means it will observe changes...
      }
    },

    unchain: function (key, path) {
      var chains = this._chains;
      var node = chains[key];

      // unchain rest of path first...
      if (path && path.length > 1) {
        var nextKey = firstKey(path);
        var nextPath = path.slice(nextKey.length + 1);
        node.unchain(nextKey, nextPath);
      }

      // delete node if needed.
      node.count--;
      if (node.count <= 0) {
        delete chains[node._key];
        node.destroy();
      }
    },

    willChange: function (events) {
      var chains = this._chains;
      if (chains) {
        for (var key in chains) {
          if (!chains.hasOwnProperty(key)) {
            continue;
          }
          chains[key].willChange(events);
        }
      }

      if (this._parent) {
        this._parent.chainWillChange(this, this._key, 1, events);
      }
    },

    chainWillChange: function (chain, path, depth, events) {
      if (this._key) {
        path = this._key + "." + path;
      }

      if (this._parent) {
        this._parent.chainWillChange(this, path, depth + 1, events);
      } else {
        if (depth > 1) {
          events.push(this.value(), path);
        }
        path = "this." + path;
        if (this._paths[path] > 0) {
          events.push(this.value(), path);
        }
      }
    },

    chainDidChange: function (chain, path, depth, events) {
      if (this._key) {
        path = this._key + "." + path;
      }

      if (this._parent) {
        this._parent.chainDidChange(this, path, depth + 1, events);
      } else {
        if (depth > 1) {
          events.push(this.value(), path);
        }
        path = "this." + path;
        if (this._paths[path] > 0) {
          events.push(this.value(), path);
        }
      }
    },

    didChange: function (events) {
      // invalidate my own value first.
      if (this._watching) {
        var obj = this._parent.value();
        if (obj !== this._object) {
          removeChainWatcher(this._object, this._key, this);
          this._object = obj;
          addChainWatcher(obj, this._key, this);
        }
        this._value = undefined;

        // Special-case: the EachProxy relies on immediate evaluation to
        // establish its observers.
        if (this._parent && this._parent._key === "@each") {
          this.value();
        }
      }

      // then notify chains...
      var chains = this._chains;
      if (chains) {
        for (var key in chains) {
          if (!chains.hasOwnProperty(key)) {
            continue;
          }
          chains[key].didChange(events);
        }
      }

      // if no events are passed in then we only care about the above wiring update
      if (events === null) {
        return;
      }

      // and finally tell parent about my path changing...
      if (this._parent) {
        this._parent.chainDidChange(this, this._key, 1, events);
      }
    }
  };
  function finishChains(obj) {
    // We only create meta if we really have to
    var m = obj["__ember_meta__"];
    var chains, chainWatchers, chainNodes;

    if (m) {
      // finish any current chains node watchers that reference obj
      chainWatchers = m.chainWatchers;
      if (chainWatchers) {
        for (var key in chainWatchers) {
          if (!chainWatchers.hasOwnProperty(key)) {
            continue;
          }

          chainNodes = chainWatchers[key];
          if (chainNodes) {
            for (var i = 0, l = chainNodes.length; i < l; i++) {
              chainNodes[i].didChange(null);
            }
          }
        }
      }
      // copy chains from prototype
      chains = m.chains;
      if (chains && chains.value() !== obj) {
        utils.meta(obj).chains = chains = chains.copy(obj);
      }
    }
  }

});
enifed('ember-metal/computed', ['exports', 'ember-metal/property_set', 'ember-metal/utils', 'ember-metal/expand_properties', 'ember-metal/error', 'ember-metal/properties', 'ember-metal/property_events', 'ember-metal/dependent_keys'], function (exports, property_set, utils, expandProperties, EmberError, properties, property_events, dependent_keys) {

  'use strict';

  exports.ComputedProperty = ComputedProperty;
  exports.computed = computed;
  exports.cacheFor = cacheFor;

  var metaFor = utils.meta;

  function UNDEFINED() {}

  // ..........................................................
  // COMPUTED PROPERTY
  //

  /**
    A computed property transforms an object's function into a property.

    By default the function backing the computed property will only be called
    once and the result will be cached. You can specify various properties
    that your computed property depends on. This will force the cached
    result to be recomputed if the dependencies are modified.

    In the following example we declare a computed property (by calling
    `.property()` on the fullName function) and setup the property
    dependencies (depending on firstName and lastName). The fullName function
    will be called once (regardless of how many times it is accessed) as long
    as its dependencies have not changed. Once firstName or lastName are updated
    any future calls (or anything bound) to fullName will incorporate the new
    values.

    ```javascript
    var Person = Ember.Object.extend({
      // these will be supplied by `create`
      firstName: null,
      lastName: null,

      fullName: function() {
        var firstName = this.get('firstName');
        var lastName = this.get('lastName');

       return firstName + ' ' + lastName;
      }.property('firstName', 'lastName')
    });

    var tom = Person.create({
      firstName: 'Tom',
      lastName: 'Dale'
    });

    tom.get('fullName') // 'Tom Dale'
    ```

    You can also define what Ember should do when setting a computed property.
    If you try to set a computed property, it will be invoked with the key and
    value you want to set it to. You can also accept the previous value as the
    third parameter.

    ```javascript
    var Person = Ember.Object.extend({
      // these will be supplied by `create`
      firstName: null,
      lastName: null,

      fullName: function(key, value, oldValue) {
        // getter
        if (arguments.length === 1) {
          var firstName = this.get('firstName');
          var lastName = this.get('lastName');

          return firstName + ' ' + lastName;

        // setter
        } else {
          var name = value.split(' ');

          this.set('firstName', name[0]);
          this.set('lastName', name[1]);

          return value;
        }
      }.property('firstName', 'lastName')
    });

    var person = Person.create();

    person.set('fullName', 'Peter Wagenet');
    person.get('firstName'); // 'Peter'
    person.get('lastName');  // 'Wagenet'
    ```

    @class ComputedProperty
    @namespace Ember
    @constructor
  */
  function ComputedProperty(config, opts) {
    this.isDescriptor = true;
    if (typeof config === "function") {
      config.__ember_arity = config.length;
      this._getter = config;
      if (config.__ember_arity > 1) {
        Ember.deprecate("Using the same function as getter and setter is deprecated.", false, {
          url: "http://emberjs.com/deprecations/v1.x/#toc_deprecate-using-the-same-function-as-getter-and-setter-in-computed-properties"
        });
        this._setter = config;
      }
    } else {
      this._getter = config.get;
      this._setter = config.set;
      if (this._setter && this._setter.__ember_arity === undefined) {
        this._setter.__ember_arity = this._setter.length;
      }
    }

    this._dependentKeys = undefined;
    this._suspended = undefined;
    this._meta = undefined;

    Ember.deprecate("Passing opts.cacheable to the CP constructor is deprecated. Invoke `volatile()` on the CP instead.", !opts || !opts.hasOwnProperty("cacheable"));
    this._cacheable = opts && opts.cacheable !== undefined ? opts.cacheable : true; // TODO: Set always to `true` once this deprecation is gone.
    this._dependentKeys = opts && opts.dependentKeys;
    Ember.deprecate("Passing opts.readOnly to the CP constructor is deprecated. All CPs are writable by default. You can invoke `readOnly()` on the CP to change this.", !opts || !opts.hasOwnProperty("readOnly"));
    this._readOnly = opts && (opts.readOnly !== undefined || !!opts.readOnly) || false; // TODO: Set always to `false` once this deprecation is gone.
  }

  ComputedProperty.prototype = new properties.Descriptor();

  var ComputedPropertyPrototype = ComputedProperty.prototype;

  /**
    Properties are cacheable by default. Computed property will automatically
    cache the return value of your function until one of the dependent keys changes.

    Call `volatile()` to set it into non-cached mode. When in this mode
    the computed property will not automatically cache the return value.

    However, if a property is properly observable, there is no reason to disable
    caching.

    @method cacheable
    @param {Boolean} aFlag optional set to `false` to disable caching
    @return {Ember.ComputedProperty} this
    @chainable
    @deprecated All computed properties are cacheble by default. Use `volatile()` instead to opt-out to caching.
  */
  ComputedPropertyPrototype.cacheable = function (aFlag) {
    Ember.deprecate("ComputedProperty.cacheable() is deprecated. All computed properties are cacheable by default.");
    this._cacheable = aFlag !== false;
    return this;
  };

  /**
    Call on a computed property to set it into non-cached mode. When in this
    mode the computed property will not automatically cache the return value.

    ```javascript
    var outsideService = Ember.Object.extend({
      value: function() {
        return OutsideService.getValue();
      }.property().volatile()
    }).create();
    ```

    @method volatile
    @return {Ember.ComputedProperty} this
    @chainable
  */
  ComputedPropertyPrototype["volatile"] = function () {
    this._cacheable = false;
    return this;
  };

  /**
    Call on a computed property to set it into read-only mode. When in this
    mode the computed property will throw an error when set.

    ```javascript
    var Person = Ember.Object.extend({
      guid: function() {
        return 'guid-guid-guid';
      }.property().readOnly()
    });

    var person = Person.create();

    person.set('guid', 'new-guid'); // will throw an exception
    ```

    @method readOnly
    @return {Ember.ComputedProperty} this
    @chainable
  */
  ComputedPropertyPrototype.readOnly = function (readOnly) {
    Ember.deprecate("Passing arguments to ComputedProperty.readOnly() is deprecated.", arguments.length === 0);
    this._readOnly = readOnly === undefined || !!readOnly; // Force to true once this deprecation is gone
    Ember.assert("Computed properties that define a setter using the new syntax cannot be read-only", !(this._readOnly && this._setter && this._setter !== this._getter));
    return this;
  };

  /**
    Sets the dependent keys on this computed property. Pass any number of
    arguments containing key paths that this computed property depends on.

    ```javascript
    var President = Ember.Object.extend({
      fullName: computed(function() {
        return this.get('firstName') + ' ' + this.get('lastName');

        // Tell Ember that this computed property depends on firstName
        // and lastName
      }).property('firstName', 'lastName')
    });

    var president = President.create({
      firstName: 'Barack',
      lastName: 'Obama'
    });

    president.get('fullName'); // 'Barack Obama'
    ```

    @method property
    @param {String} path* zero or more property paths
    @return {Ember.ComputedProperty} this
    @chainable
  */
  ComputedPropertyPrototype.property = function () {
    var args;

    var addArg = function (property) {
      args.push(property);
    };

    args = [];
    for (var i = 0, l = arguments.length; i < l; i++) {
      expandProperties['default'](arguments[i], addArg);
    }

    this._dependentKeys = args;
    return this;
  };

  /**
    In some cases, you may want to annotate computed properties with additional
    metadata about how they function or what values they operate on. For example,
    computed property functions may close over variables that are then no longer
    available for introspection.

    You can pass a hash of these values to a computed property like this:

    ```
    person: function() {
      var personId = this.get('personId');
      return App.Person.create({ id: personId });
    }.property().meta({ type: App.Person })
    ```

    The hash that you pass to the `meta()` function will be saved on the
    computed property descriptor under the `_meta` key. Ember runtime
    exposes a public API for retrieving these values from classes,
    via the `metaForProperty()` function.

    @method meta
    @param {Hash} meta
    @chainable
  */

  ComputedPropertyPrototype.meta = function (meta) {
    if (arguments.length === 0) {
      return this._meta || {};
    } else {
      this._meta = meta;
      return this;
    }
  };

  /* impl descriptor API */
  ComputedPropertyPrototype.didChange = function (obj, keyName) {
    // _suspended is set via a CP.set to ensure we don't clear
    // the cached value set by the setter
    if (this._cacheable && this._suspended !== obj) {
      var meta = metaFor(obj);
      if (meta.cache && meta.cache[keyName] !== undefined) {
        meta.cache[keyName] = undefined;
        dependent_keys.removeDependentKeys(this, obj, keyName, meta);
      }
    }
  };

  function finishChains(chainNodes) {
    for (var i = 0, l = chainNodes.length; i < l; i++) {
      chainNodes[i].didChange(null);
    }
  }

  /**
    Access the value of the function backing the computed property.
    If this property has already been cached, return the cached result.
    Otherwise, call the function passing the property name as an argument.

    ```javascript
    var Person = Ember.Object.extend({
      fullName: function(keyName) {
        // the keyName parameter is 'fullName' in this case.
        return this.get('firstName') + ' ' + this.get('lastName');
      }.property('firstName', 'lastName')
    });


    var tom = Person.create({
      firstName: 'Tom',
      lastName: 'Dale'
    });

    tom.get('fullName') // 'Tom Dale'
    ```

    @method get
    @param {String} keyName The key being accessed.
    @return {Object} The return value of the function backing the CP.
  */
  ComputedPropertyPrototype.get = function (obj, keyName) {
    var ret, cache, meta, chainNodes;
    if (this._cacheable) {
      meta = metaFor(obj);
      cache = meta.cache;

      var result = cache && cache[keyName];

      if (result === UNDEFINED) {
        return undefined;
      } else if (result !== undefined) {
        return result;
      }

      ret = this._getter.call(obj, keyName);
      cache = meta.cache;
      if (!cache) {
        cache = meta.cache = {};
      }
      if (ret === undefined) {
        cache[keyName] = UNDEFINED;
      } else {
        cache[keyName] = ret;
      }

      chainNodes = meta.chainWatchers && meta.chainWatchers[keyName];
      if (chainNodes) {
        finishChains(chainNodes);
      }
      dependent_keys.addDependentKeys(this, obj, keyName, meta);
    } else {
      ret = this._getter.call(obj, keyName);
    }
    return ret;
  };

  /**
    Set the value of a computed property. If the function that backs your
    computed property does not accept arguments then the default action for
    setting would be to define the property on the current object, and set
    the value of the property to the value being set.

    Generally speaking if you intend for your computed property to be set
    your backing function should accept either two or three arguments.

    ```javascript
    var Person = Ember.Object.extend({
      // these will be supplied by `create`
      firstName: null,
      lastName: null,

      fullName: function(key, value, oldValue) {
        // getter
        if (arguments.length === 1) {
          var firstName = this.get('firstName');
          var lastName = this.get('lastName');

          return firstName + ' ' + lastName;

        // setter
        } else {
          var name = value.split(' ');

          this.set('firstName', name[0]);
          this.set('lastName', name[1]);

          return value;
        }
      }.property('firstName', 'lastName')
    });

    var person = Person.create();

    person.set('fullName', 'Peter Wagenet');
    person.get('firstName'); // 'Peter'
    person.get('lastName');  // 'Wagenet'
    ```

    @method set
    @param {String} keyName The key being accessed.
    @param {Object} newValue The new value being assigned.
    @param {String} oldValue The old value being replaced.
    @return {Object} The return value of the function backing the CP.
  */
  ComputedPropertyPrototype.set = function computedPropertySetWithSuspend(obj, keyName, value) {
    var oldSuspended = this._suspended;

    this._suspended = obj;

    try {
      this._set(obj, keyName, value);
    } finally {
      this._suspended = oldSuspended;
    }
  };

  ComputedPropertyPrototype._set = function computedPropertySet(obj, keyName, value) {
    var cacheable = this._cacheable;
    var setter = this._setter;
    var meta = metaFor(obj, cacheable);
    var cache = meta.cache;
    var hadCachedValue = false;

    var cachedValue, ret;

    if (this._readOnly) {
      throw new EmberError['default']("Cannot set read-only property \"" + keyName + "\" on object: " + utils.inspect(obj));
    }

    if (cacheable && cache && cache[keyName] !== undefined) {
      if (cache[keyName] !== UNDEFINED) {
        cachedValue = cache[keyName];
      }

      hadCachedValue = true;
    }

    if (!setter) {
      properties.defineProperty(obj, keyName, null, cachedValue);
      property_set.set(obj, keyName, value);
      return;
    } else if (setter.__ember_arity === 2) {
      // Is there any way of deprecate this in a sensitive way?
      // Maybe now that getters and setters are the prefered options we can....
      ret = setter.call(obj, keyName, value);
    } else {
      ret = setter.call(obj, keyName, value, cachedValue);
    }

    if (hadCachedValue && cachedValue === ret) {
      return;
    }

    var watched = meta.watching[keyName];
    if (watched) {
      property_events.propertyWillChange(obj, keyName);
    }

    if (hadCachedValue) {
      cache[keyName] = undefined;
    }

    if (cacheable) {
      if (!hadCachedValue) {
        dependent_keys.addDependentKeys(this, obj, keyName, meta);
      }
      if (!cache) {
        cache = meta.cache = {};
      }
      if (ret === undefined) {
        cache[keyName] = UNDEFINED;
      } else {
        cache[keyName] = ret;
      }
    }

    if (watched) {
      property_events.propertyDidChange(obj, keyName);
    }

    return ret;
  };

  /* called before property is overridden */
  ComputedPropertyPrototype.teardown = function (obj, keyName) {
    var meta = metaFor(obj);

    if (meta.cache) {
      if (keyName in meta.cache) {
        dependent_keys.removeDependentKeys(this, obj, keyName, meta);
      }

      if (this._cacheable) {
        delete meta.cache[keyName];
      }
    }

    return null; // no value to restore
  };

  /**
    This helper returns a new property descriptor that wraps the passed
    computed property function. You can use this helper to define properties
    with mixins or via `Ember.defineProperty()`.

    The function you pass will be used to both get and set property values.
    The function should accept two parameters, key and value. If value is not
    undefined you should set the value first. In either case return the
    current value of the property.

    A computed property defined in this way might look like this:

    ```js
    var Person = Ember.Object.extend({
      firstName: 'Betty',
      lastName: 'Jones',

      fullName: Ember.computed('firstName', 'lastName', function(key, value) {
        return this.get('firstName') + ' ' + this.get('lastName');
      })
    });

    var client = Person.create();

    client.get('fullName'); // 'Betty Jones'

    client.set('lastName', 'Fuller');
    client.get('fullName'); // 'Betty Fuller'
    ```

    _Note: This is the preferred way to define computed properties when writing third-party
    libraries that depend on or use Ember, since there is no guarantee that the user
    will have prototype extensions enabled._

    You might use this method if you disabled
    [Prototype Extensions](http://emberjs.com/guides/configuring-ember/disabling-prototype-extensions/).
    The alternative syntax might look like this
    (if prototype extensions are enabled, which is the default behavior):

    ```js
    fullName: function () {
      return this.get('firstName') + ' ' + this.get('lastName');
    }.property('firstName', 'lastName')
    ```

    @class computed
    @namespace Ember
    @constructor
    @static
    @param {String} [dependentKeys*] Optional dependent keys that trigger this computed property.
    @param {Function} func The computed property function.
    @return {Ember.ComputedProperty} property descriptor instance
  */
  function computed(func) {
    var args;

    if (arguments.length > 1) {
      args = [].slice.call(arguments);
      func = args.pop();
    }

    var cp = new ComputedProperty(func);

    if (args) {
      cp.property.apply(cp, args);
    }

    return cp;
  }

  /**
    Returns the cached value for a property, if one exists.
    This can be useful for peeking at the value of a computed
    property that is generated lazily, without accidentally causing
    it to be created.

    @method cacheFor
    @for Ember
    @param {Object} obj the object whose property you want to check
    @param {String} key the name of the property whose cached value you want
      to return
    @return {Object} the cached value
  */
  function cacheFor(obj, key) {
    var meta = obj["__ember_meta__"];
    var cache = meta && meta.cache;
    var ret = cache && cache[key];

    if (ret === UNDEFINED) {
      return undefined;
    }
    return ret;
  }

  cacheFor.set = function (cache, key, value) {
    if (value === undefined) {
      cache[key] = UNDEFINED;
    } else {
      cache[key] = value;
    }
  };

  cacheFor.get = function (cache, key) {
    var ret = cache[key];
    if (ret === UNDEFINED) {
      return undefined;
    }
    return ret;
  };

  cacheFor.remove = function (cache, key) {
    cache[key] = undefined;
  };

});
enifed('ember-metal/computed_macros', ['exports', 'ember-metal/core', 'ember-metal/property_get', 'ember-metal/property_set', 'ember-metal/computed', 'ember-metal/is_empty', 'ember-metal/is_none', 'ember-metal/alias'], function (exports, Ember, property_get, property_set, computed, isEmpty, isNone, alias) {

  'use strict';

  exports.empty = empty;
  exports.notEmpty = notEmpty;
  exports.none = none;
  exports.not = not;
  exports.bool = bool;
  exports.match = match;
  exports.equal = equal;
  exports.gt = gt;
  exports.gte = gte;
  exports.lt = lt;
  exports.lte = lte;
  exports.oneWay = oneWay;
  exports.readOnly = readOnly;
  exports.defaultTo = defaultTo;
  exports.deprecatingAlias = deprecatingAlias;

  /**
    A computed property that returns true if the value of the dependent
    property is null, an empty string, empty array, or empty function.

    Example

    ```javascript
    var ToDoList = Ember.Object.extend({
      isDone: Ember.computed.empty('todos')
    });

    var todoList = ToDoList.create({
      todos: ['Unit Test', 'Documentation', 'Release']
    });

    todoList.get('isDone'); // false
    todoList.get('todos').clear();
    todoList.get('isDone'); // true
    ```

    @since 1.6.0
    @method empty
    @for Ember.computed
    @param {String} dependentKey
    @return {Ember.ComputedProperty} computed property which negate
    the original value for property
  */
  function getProperties(self, propertyNames) {
    var ret = {};
    for (var i = 0; i < propertyNames.length; i++) {
      ret[propertyNames[i]] = property_get.get(self, propertyNames[i]);
    }
    return ret;
  }

  function generateComputedWithProperties(macro) {
    return function () {
      for (var _len = arguments.length, properties = Array(_len), _key = 0; _key < _len; _key++) {
        properties[_key] = arguments[_key];
      }

      var computedFunc = computed.computed(function () {
        return macro.apply(this, [getProperties(this, properties)]);
      });

      return computedFunc.property.apply(computedFunc, properties);
    };
  }
  function empty(dependentKey) {
    return computed.computed(dependentKey + ".length", function () {
      return isEmpty['default'](property_get.get(this, dependentKey));
    });
  }

  function notEmpty(dependentKey) {
    return computed.computed(dependentKey + ".length", function () {
      return !isEmpty['default'](property_get.get(this, dependentKey));
    });
  }

  function none(dependentKey) {
    return computed.computed(dependentKey, function () {
      return isNone['default'](property_get.get(this, dependentKey));
    });
  }

  function not(dependentKey) {
    return computed.computed(dependentKey, function () {
      return !property_get.get(this, dependentKey);
    });
  }

  function bool(dependentKey) {
    return computed.computed(dependentKey, function () {
      return !!property_get.get(this, dependentKey);
    });
  }

  function match(dependentKey, regexp) {
    return computed.computed(dependentKey, function () {
      var value = property_get.get(this, dependentKey);

      return typeof value === "string" ? regexp.test(value) : false;
    });
  }

  function equal(dependentKey, value) {
    return computed.computed(dependentKey, function () {
      return property_get.get(this, dependentKey) === value;
    });
  }

  function gt(dependentKey, value) {
    return computed.computed(dependentKey, function () {
      return property_get.get(this, dependentKey) > value;
    });
  }

  function gte(dependentKey, value) {
    return computed.computed(dependentKey, function () {
      return property_get.get(this, dependentKey) >= value;
    });
  }

  function lt(dependentKey, value) {
    return computed.computed(dependentKey, function () {
      return property_get.get(this, dependentKey) < value;
    });
  }

  function lte(dependentKey, value) {
    return computed.computed(dependentKey, function () {
      return property_get.get(this, dependentKey) <= value;
    });
  }

  /**
    A computed property that performs a logical `and` on the
    original values for the provided dependent properties.

    Example

    ```javascript
    var Hamster = Ember.Object.extend({
      readyForCamp: Ember.computed.and('hasTent', 'hasBackpack')
    });

    var hamster = Hamster.create();

    hamster.get('readyForCamp'); // false
    hamster.set('hasTent', true);
    hamster.get('readyForCamp'); // false
    hamster.set('hasBackpack', true);
    hamster.get('readyForCamp'); // true
    hamster.set('hasBackpack', 'Yes');
    hamster.get('readyForCamp'); // 'Yes'
    ```

    @method and
    @for Ember.computed
    @param {String} dependentKey*
    @return {Ember.ComputedProperty} computed property which performs
    a logical `and` on the values of all the original values for properties.
  */
  var and = generateComputedWithProperties(function (properties) {
    var value;
    for (var key in properties) {
      value = properties[key];
      if (properties.hasOwnProperty(key) && !value) {
        return false;
      }
    }
    return value;
  });

  var or = generateComputedWithProperties(function (properties) {
    for (var key in properties) {
      if (properties.hasOwnProperty(key) && properties[key]) {
        return properties[key];
      }
    }
    return false;
  });

  var any = generateComputedWithProperties(function (properties) {
    for (var key in properties) {
      if (properties.hasOwnProperty(key) && properties[key]) {
        return properties[key];
      }
    }
    return null;
  });

  var collect = generateComputedWithProperties(function (properties) {
    var res = Ember['default'].A();
    for (var key in properties) {
      if (properties.hasOwnProperty(key)) {
        if (isNone['default'](properties[key])) {
          res.push(null);
        } else {
          res.push(properties[key]);
        }
      }
    }
    return res;
  });function oneWay(dependentKey) {
    return alias['default'](dependentKey).oneWay();
  }

  function readOnly(dependentKey) {
    return alias['default'](dependentKey).readOnly();
  }

  function defaultTo(defaultPath) {
    return computed.computed({
      get: function (key) {
        Ember['default'].deprecate("Usage of Ember.computed.defaultTo is deprecated, use `Ember.computed.oneWay` instead.");
        return property_get.get(this, defaultPath);
      },

      set: function (key, newValue, cachedValue) {
        Ember['default'].deprecate("Usage of Ember.computed.defaultTo is deprecated, use `Ember.computed.oneWay` instead.");
        return newValue != null ? newValue : property_get.get(this, defaultPath);
      }
    });
  }

  function deprecatingAlias(dependentKey) {
    return computed.computed(dependentKey, {
      get: function (key) {
        Ember['default'].deprecate("Usage of `" + key + "` is deprecated, use `" + dependentKey + "` instead.");
        return property_get.get(this, dependentKey);
      },
      set: function (key, value) {
        Ember['default'].deprecate("Usage of `" + key + "` is deprecated, use `" + dependentKey + "` instead.");
        property_set.set(this, dependentKey, value);
        return value;
      }
    });
  }

  exports.and = and;
  exports.or = or;
  exports.any = any;
  exports.collect = collect;

});
enifed('ember-metal/core', ['exports'], function (exports) {

  'use strict';

  exports.K = K;

  /*globals Ember:true,ENV,EmberENV */

  /**
  @module ember
  @submodule ember-metal
  */

  /**
    All Ember methods and functions are defined inside of this namespace. You
    generally should not add new properties to this namespace as it may be
    overwritten by future versions of Ember.

    You can also use the shorthand `Em` instead of `Ember`.

    Ember-Runtime is a framework that provides core functions for Ember including
    cross-platform functions, support for property observing and objects. Its
    focus is on small size and performance. You can use this in place of or
    along-side other cross-platform libraries such as jQuery.

    The core Runtime framework is based on the jQuery API with a number of
    performance optimizations.

    @class Ember
    @static
    @version 1.13.0-beta.1.ce345f0e
  */

  if ('undefined' === typeof Ember) {
    // Create core object. Make it act like an instance of Ember.Namespace so that
    // objects assigned to it are given a sane string representation.
    Ember = {};
  }

  // Default imports, exports and lookup to the global object;
  var global = mainContext || {}; // jshint ignore:line
  Ember.imports = Ember.imports || global;
  Ember.lookup = Ember.lookup || global;
  var emExports = Ember.exports = Ember.exports || global;

  // aliases needed to keep minifiers from removing the global context
  emExports.Em = emExports.Ember = Ember;

  // Make sure these are set whether Ember was already defined or not

  Ember.isNamespace = true;

  Ember.toString = function () {
    return 'Ember';
  };

  /**
    @property VERSION
    @type String
    @default '1.13.0-beta.1.ce345f0e'
    @static
  */
  Ember.VERSION = '1.13.0-beta.1.ce345f0e';

  /**
    Standard environmental variables. You can define these in a global `EmberENV`
    variable before loading Ember to control various configuration settings.

    For backwards compatibility with earlier versions of Ember the global `ENV`
    variable will be used if `EmberENV` is not defined.

    @property ENV
    @type Hash
  */

  if (Ember.ENV) {
    // do nothing if Ember.ENV is already setup
    Ember.assert('Ember.ENV should be an object.', 'object' !== typeof Ember.ENV);
  } else if ('undefined' !== typeof EmberENV) {
    Ember.ENV = EmberENV;
  } else if ('undefined' !== typeof ENV) {
    Ember.ENV = ENV;
  } else {
    Ember.ENV = {};
  }

  Ember.config = Ember.config || {};

  // We disable the RANGE API by default for performance reasons
  if ('undefined' === typeof Ember.ENV.DISABLE_RANGE_API) {
    Ember.ENV.DISABLE_RANGE_API = true;
  }

  /**
    Hash of enabled Canary features. Add to this before creating your application.

    You can also define `EmberENV.FEATURES` if you need to enable features flagged at runtime.

    @class FEATURES
    @namespace Ember
    @static
    @since 1.1.0
  */
  Ember.FEATURES = { 'features-stripped-test': false, 'ember-routing-named-substates': true, 'mandatory-setter': true, 'ember-htmlbars-component-generation': true, 'ember-htmlbars-component-helper': true, 'ember-htmlbars-inline-if-helper': true, 'ember-htmlbars-attribute-syntax': true, 'ember-routing-transitioning-classes': true, 'ember-testing-checkbox-helpers': false, 'ember-metal-stream': false, 'ember-application-instance-initializers': true, 'ember-application-initializer-context': true, 'ember-router-willtransition': true, 'ember-application-visit': false, 'ember-views-component-block-info': true, 'ember-routing-core-outlet': false, 'ember-libraries-isregistered': false, 'ember-routing-htmlbars-improved-actions': true }; //jshint ignore:line

  if (Ember.ENV.FEATURES) {
    for (var feature in Ember.ENV.FEATURES) {
      if (Ember.ENV.FEATURES.hasOwnProperty(feature)) {
        Ember.FEATURES[feature] = Ember.ENV.FEATURES[feature];
      }
    }
  }

  /**
    Test that a feature is enabled. Parsed by Ember's build tools to leave
    experimental features out of beta/stable builds.

    You can define the following configuration options:

    * `EmberENV.ENABLE_ALL_FEATURES` - force all features to be enabled.
    * `EmberENV.ENABLE_OPTIONAL_FEATURES` - enable any features that have not been explicitly
      enabled/disabled.

    @method isEnabled
    @param {String} feature
    @return {Boolean}
    @for Ember.FEATURES
    @since 1.1.0
  */

  Ember.FEATURES.isEnabled = function (feature) {
    var featureValue = Ember.FEATURES[feature];

    if (Ember.ENV.ENABLE_ALL_FEATURES) {
      return true;
    } else if (featureValue === true || featureValue === false || featureValue === undefined) {
      return featureValue;
    } else if (Ember.ENV.ENABLE_OPTIONAL_FEATURES) {
      return true;
    } else {
      return false;
    }
  };

  // ..........................................................
  // BOOTSTRAP
  //

  /**
    Determines whether Ember should enhance some built-in object prototypes to
    provide a more friendly API. If enabled, a few methods will be added to
    `Function`, `String`, and `Array`. `Object.prototype` will not be enhanced,
    which is the one that causes most trouble for people.

    In general we recommend leaving this option set to true since it rarely
    conflicts with other code. If you need to turn it off however, you can
    define an `EmberENV.EXTEND_PROTOTYPES` config to disable it.

    @property EXTEND_PROTOTYPES
    @type Boolean
    @default true
    @for Ember
  */
  Ember.EXTEND_PROTOTYPES = Ember.ENV.EXTEND_PROTOTYPES;

  if (typeof Ember.EXTEND_PROTOTYPES === 'undefined') {
    Ember.EXTEND_PROTOTYPES = true;
  }

  /**
    Determines whether Ember logs a full stack trace during deprecation warnings

    @property LOG_STACKTRACE_ON_DEPRECATION
    @type Boolean
    @default true
  */
  Ember.LOG_STACKTRACE_ON_DEPRECATION = Ember.ENV.LOG_STACKTRACE_ON_DEPRECATION !== false;

  /**
    Determines whether Ember should add ECMAScript 5 Array shims to older browsers.

    @property SHIM_ES5
    @type Boolean
    @default Ember.EXTEND_PROTOTYPES
  */
  Ember.SHIM_ES5 = Ember.ENV.SHIM_ES5 === false ? false : Ember.EXTEND_PROTOTYPES;

  /**
    Determines whether Ember logs info about version of used libraries

    @property LOG_VERSION
    @type Boolean
    @default true
  */
  Ember.LOG_VERSION = Ember.ENV.LOG_VERSION === false ? false : true;

  /**
    Empty function. Useful for some operations. Always returns `this`.

    @method K
    @private
    @return {Object}
  */
  function K() {
    return this;
  }
  Ember.K = K;
  //TODO: ES6 GLOBAL TODO

  // Stub out the methods defined by the ember-debug package in case it's not loaded

  if ('undefined' === typeof Ember.assert) {
    Ember.assert = K;
  }
  if ('undefined' === typeof Ember.warn) {
    Ember.warn = K;
  }
  if ('undefined' === typeof Ember.debug) {
    Ember.debug = K;
  }
  if ('undefined' === typeof Ember.runInDebug) {
    Ember.runInDebug = K;
  }
  if ('undefined' === typeof Ember.deprecate) {
    Ember.deprecate = K;
  }
  if ('undefined' === typeof Ember.deprecateFunc) {
    Ember.deprecateFunc = function (_, func) {
      return func;
    };
  }

  exports['default'] = Ember;

});
enifed('ember-metal/dependent_keys', ['exports', 'ember-metal/platform/create', 'ember-metal/watching'], function (exports, o_create, watching) {

  
  exports.addDependentKeys = addDependentKeys;
  exports.removeDependentKeys = removeDependentKeys;

  "REMOVE_USE_STRICT: true"; /**
                             @module ember-metal
                             */

  // ..........................................................
  // DEPENDENT KEYS
  //

  // data structure:
  //  meta.deps = {
  //    'depKey': {
  //      'keyName': count,
  //    }
  //  }

  /*
    This function returns a map of unique dependencies for a
    given object and key.
  */
  function keysForDep(depsMeta, depKey) {
    var keys = depsMeta[depKey];
    if (!keys) {
      // if there are no dependencies yet for a the given key
      // create a new empty list of dependencies for the key
      keys = depsMeta[depKey] = {};
    } else if (!depsMeta.hasOwnProperty(depKey)) {
      // otherwise if the dependency list is inherited from
      // a superclass, clone the hash
      keys = depsMeta[depKey] = o_create['default'](keys);
    }
    return keys;
  }

  function metaForDeps(meta) {
    return keysForDep(meta, "deps");
  }
  function addDependentKeys(desc, obj, keyName, meta) {
    // the descriptor has a list of dependent keys, so
    // add all of its dependent keys.
    var depsMeta, idx, len, depKey, keys;
    var depKeys = desc._dependentKeys;
    if (!depKeys) {
      return;
    }

    depsMeta = metaForDeps(meta);

    for (idx = 0, len = depKeys.length; idx < len; idx++) {
      depKey = depKeys[idx];
      // Lookup keys meta for depKey
      keys = keysForDep(depsMeta, depKey);
      // Increment the number of times depKey depends on keyName.
      keys[keyName] = (keys[keyName] || 0) + 1;
      // Watch the depKey
      watching.watch(obj, depKey, meta);
    }
  }

  function removeDependentKeys(desc, obj, keyName, meta) {
    // the descriptor has a list of dependent keys, so
    // remove all of its dependent keys.
    var depKeys = desc._dependentKeys;
    var depsMeta, idx, len, depKey, keys;
    if (!depKeys) {
      return;
    }

    depsMeta = metaForDeps(meta);

    for (idx = 0, len = depKeys.length; idx < len; idx++) {
      depKey = depKeys[idx];
      // Lookup keys meta for depKey
      keys = keysForDep(depsMeta, depKey);
      // Decrement the number of times depKey depends on keyName.
      keys[keyName] = (keys[keyName] || 0) - 1;
      // Unwatch the depKey
      watching.unwatch(obj, depKey, meta);
    }
  }

});
enifed('ember-metal/deprecate_property', ['exports', 'ember-metal/core', 'ember-metal/platform/define_property', 'ember-metal/properties', 'ember-metal/property_get', 'ember-metal/property_set'], function (exports, Ember, define_property, properties, property_get, property_set) {

  'use strict';

  exports.deprecateProperty = deprecateProperty;

  /**
    Used internally to allow changing properties in a backwards compatible way, and print a helpful
    deprecation warning.

    @method deprecateProperty
    @param {Object} object The object to add the deprecated property to.
    @param {String} deprecatedKey The property to add (and print deprecation warnings upon accessing).
    @param {String} newKey The property that will be aliased.
    @private
    @since 1.7.0
  */

  function deprecateProperty(object, deprecatedKey, newKey) {
    function deprecate() {
      Ember['default'].deprecate("Usage of `" + deprecatedKey + "` is deprecated, use `" + newKey + "` instead.");
    }

    if (define_property.hasPropertyAccessors) {
      properties.defineProperty(object, deprecatedKey, {
        configurable: true,
        enumerable: false,
        set: function (value) {
          deprecate();
          property_set.set(this, newKey, value);
        },
        get: function () {
          deprecate();
          return property_get.get(this, newKey);
        }
      });
    }
  }

});
enifed('ember-metal/dictionary', ['exports', 'ember-metal/platform/create'], function (exports, create) {

  'use strict';



  // the delete is meant to hint at runtimes that this object should remain in
  // dictionary mode. This is clearly a runtime specific hack, but currently it
  // appears worthwhile in some usecases. Please note, these deletes do increase
  // the cost of creation dramatically over a plain Object.create. And as this
  // only makes sense for long-lived dictionaries that aren't instantiated often.
  exports['default'] = makeDictionary;
  function makeDictionary(parent) {
    var dict = create['default'](parent);
    dict['_dict'] = null;
    delete dict['_dict'];
    return dict;
  }

});
enifed('ember-metal/enumerable_utils', ['exports', 'ember-metal/array'], function (exports, ember_metal__array) {

  'use strict';

  exports.map = map;
  exports.forEach = forEach;
  exports.filter = filter;
  exports.indexOf = indexOf;
  exports.indexesOf = indexesOf;
  exports.addObject = addObject;
  exports.removeObject = removeObject;
  exports._replace = _replace;
  exports.replace = replace;
  exports.intersection = intersection;

  /**
   * Defines some convenience methods for working with Enumerables.
   * `Ember.EnumerableUtils` uses `Ember.ArrayPolyfills` when necessary.
   *
   * @class EnumerableUtils
   * @namespace Ember
   * @static
   * */

  /**
   * Calls the map function on the passed object with a specified callback. This
   * uses `Ember.ArrayPolyfill`'s-map method when necessary.
   *
   * @method map
   * @param {Object} obj The object that should be mapped
   * @param {Function} callback The callback to execute
   * @param {Object} thisArg Value to use as this when executing *callback*
   *
   * @return {Array} An array of mapped values.
   */
  var splice = Array.prototype.splice;
  function map(obj, callback, thisArg) {
    return obj.map ? obj.map(callback, thisArg) : ember_metal__array.map.call(obj, callback, thisArg);
  }

  function forEach(obj, callback, thisArg) {
    return obj.forEach ? obj.forEach(callback, thisArg) : ember_metal__array.forEach.call(obj, callback, thisArg);
  }

  function filter(obj, callback, thisArg) {
    return obj.filter ? obj.filter(callback, thisArg) : ember_metal__array.filter.call(obj, callback, thisArg);
  }

  function indexOf(obj, element, index) {
    return obj.indexOf ? obj.indexOf(element, index) : ember_metal__array.indexOf.call(obj, element, index);
  }

  function indexesOf(obj, elements) {
    return elements === undefined ? [] : map(elements, function (item) {
      return indexOf(obj, item);
    });
  }

  function addObject(array, item) {
    var index = indexOf(array, item);
    if (index === -1) {
      array.push(item);
    }
  }

  function removeObject(array, item) {
    var index = indexOf(array, item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  function _replace(array, idx, amt, objects) {
    var args = [].concat(objects);
    var ret = [];
    // https://code.google.com/p/chromium/issues/detail?id=56588
    var size = 60000;
    var start = idx;
    var ends = amt;
    var count, chunk;

    while (args.length) {
      count = ends > size ? size : ends;
      if (count <= 0) {
        count = 0;
      }

      chunk = args.splice(0, size);
      chunk = [start, count].concat(chunk);

      start += size;
      ends -= count;

      ret = ret.concat(splice.apply(array, chunk));
    }
    return ret;
  }

  function replace(array, idx, amt, objects) {
    if (array.replace) {
      return array.replace(idx, amt, objects);
    } else {
      return _replace(array, idx, amt, objects);
    }
  }

  function intersection(array1, array2) {
    var result = [];
    forEach(array1, function (element) {
      if (indexOf(array2, element) >= 0) {
        result.push(element);
      }
    });

    return result;
  }

  // TODO: this only exists to maintain the existing api, as we move forward it
  // should only be part of the "global build" via some shim
  exports['default'] = {
    _replace: _replace,
    addObject: addObject,
    filter: filter,
    forEach: forEach,
    indexOf: indexOf,
    indexesOf: indexesOf,
    intersection: intersection,
    map: map,
    removeObject: removeObject,
    replace: replace
  };

});
enifed('ember-metal/environment', ['exports', 'ember-metal/core'], function (exports, Ember) {

  'use strict';

  var environment;

  // This code attempts to automatically detect an environment with DOM
  // by searching for window and document.createElement. An environment
  // with DOM may disable the DOM functionality of Ember explicitly by
  // defining a `disableBrowserEnvironment` ENV.
  var hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof document.createElement !== 'undefined' && !Ember['default'].ENV.disableBrowserEnvironment;

  if (hasDOM) {
    environment = {
      hasDOM: true,
      isChrome: !!window.chrome && !window.opera,
      isFirefox: typeof InstallTrigger !== 'undefined',
      location: window.location,
      history: window.history,
      userAgent: window.navigator.userAgent,
      global: window
    };
  } else {
    environment = {
      hasDOM: false,
      isChrome: false,
      isFirefox: false,
      location: null,
      history: null,
      userAgent: 'Lynx (textmode)',
      global: null
    };
  }

  exports['default'] = environment;

});
enifed('ember-metal/error', ['exports', 'ember-metal/platform/create'], function (exports, create) {

  'use strict';

  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  /**
    A subclass of the JavaScript Error object for use in Ember.

    @class Error
    @namespace Ember
    @extends Error
    @constructor
  */
  function EmberError() {
    var tmp = Error.apply(this, arguments);

    // Adds a `stack` property to the given error object that will yield the
    // stack trace at the time captureStackTrace was called.
    // When collecting the stack trace all frames above the topmost call
    // to this function, including that call, will be left out of the
    // stack trace.
    // This is useful because we can hide Ember implementation details
    // that are not very helpful for the user.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Ember.Error);
    }
    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }
  }

  EmberError.prototype = create['default'](Error.prototype);

  exports['default'] = EmberError;

});
enifed('ember-metal/events', ['exports', 'ember-metal/core', 'ember-metal/utils', 'ember-metal/platform/create'], function (exports, Ember, utils, create) {

  
  exports.accumulateListeners = accumulateListeners;
  exports.addListener = addListener;
  exports.suspendListener = suspendListener;
  exports.suspendListeners = suspendListeners;
  exports.watchedEvents = watchedEvents;
  exports.sendEvent = sendEvent;
  exports.hasListeners = hasListeners;
  exports.listenersFor = listenersFor;
  exports.on = on;
  exports.removeListener = removeListener;

  "REMOVE_USE_STRICT: true"; /* listener flags */
  var ONCE = 1;
  var SUSPENDED = 2;

  /*
    The event system uses a series of nested hashes to store listeners on an
    object. When a listener is registered, or when an event arrives, these
    hashes are consulted to determine which target and action pair to invoke.

    The hashes are stored in the object's meta hash, and look like this:

        // Object's meta hash
        {
          listeners: {       // variable name: `listenerSet`
            "foo:changed": [ // variable name: `actions`
              target, method, flags
            ]
          }
        }

  */

  function indexOf(array, target, method) {
    var index = -1;
    // hashes are added to the end of the event array
    // so it makes sense to start searching at the end
    // of the array and search in reverse
    for (var i = array.length - 3; i >= 0; i -= 3) {
      if (target === array[i] && method === array[i + 1]) {
        index = i;
        break;
      }
    }
    return index;
  }

  function actionsFor(obj, eventName) {
    var meta = utils.meta(obj, true);
    var actions;
    var listeners = meta.listeners;

    if (!listeners) {
      listeners = meta.listeners = create['default'](null);
      listeners.__source__ = obj;
    } else if (listeners.__source__ !== obj) {
      // setup inherited copy of the listeners object
      listeners = meta.listeners = create['default'](listeners);
      listeners.__source__ = obj;
    }

    actions = listeners[eventName];

    // if there are actions, but the eventName doesn't exist in our listeners, then copy them from the prototype
    if (actions && actions.__source__ !== obj) {
      actions = listeners[eventName] = listeners[eventName].slice();
      actions.__source__ = obj;
    } else if (!actions) {
      actions = listeners[eventName] = [];
      actions.__source__ = obj;
    }

    return actions;
  }
  function accumulateListeners(obj, eventName, otherActions) {
    var meta = obj["__ember_meta__"];
    var actions = meta && meta.listeners && meta.listeners[eventName];

    if (!actions) {
      return;
    }

    var newActions = [];

    for (var i = actions.length - 3; i >= 0; i -= 3) {
      var target = actions[i];
      var method = actions[i + 1];
      var flags = actions[i + 2];
      var actionIndex = indexOf(otherActions, target, method);

      if (actionIndex === -1) {
        otherActions.push(target, method, flags);
        newActions.push(target, method, flags);
      }
    }

    return newActions;
  }

  function addListener(obj, eventName, target, method, once) {
    Ember['default'].assert("You must pass at least an object and event name to Ember.addListener", !!obj && !!eventName);

    if (!method && "function" === typeof target) {
      method = target;
      target = null;
    }

    var actions = actionsFor(obj, eventName);
    var actionIndex = indexOf(actions, target, method);
    var flags = 0;

    if (once) {
      flags |= ONCE;
    }

    if (actionIndex !== -1) {
      return;
    }

    actions.push(target, method, flags);

    if ("function" === typeof obj.didAddListener) {
      obj.didAddListener(eventName, target, method);
    }
  }

  /**
    Remove an event listener

    Arguments should match those passed to `Ember.addListener`.

    @method removeListener
    @for Ember
    @param obj
    @param {String} eventName
    @param {Object|Function} target A target object or a function
    @param {Function|String} method A function or the name of a function to be called on `target`
  */
  function removeListener(obj, eventName, target, method) {
    Ember['default'].assert("You must pass at least an object and event name to Ember.removeListener", !!obj && !!eventName);

    if (!method && "function" === typeof target) {
      method = target;
      target = null;
    }

    function _removeListener(target, method) {
      var actions = actionsFor(obj, eventName);
      var actionIndex = indexOf(actions, target, method);

      // action doesn't exist, give up silently
      if (actionIndex === -1) {
        return;
      }

      actions.splice(actionIndex, 3);

      if ("function" === typeof obj.didRemoveListener) {
        obj.didRemoveListener(eventName, target, method);
      }
    }

    if (method) {
      _removeListener(target, method);
    } else {
      var meta = obj["__ember_meta__"];
      var actions = meta && meta.listeners && meta.listeners[eventName];

      if (!actions) {
        return;
      }
      for (var i = actions.length - 3; i >= 0; i -= 3) {
        _removeListener(actions[i], actions[i + 1]);
      }
    }
  }
  function suspendListener(obj, eventName, target, method, callback) {
    if (!method && "function" === typeof target) {
      method = target;
      target = null;
    }

    var actions = actionsFor(obj, eventName);
    var actionIndex = indexOf(actions, target, method);

    if (actionIndex !== -1) {
      actions[actionIndex + 2] |= SUSPENDED; // mark the action as suspended
    }

    function tryable() {
      return callback.call(target);
    }
    function finalizer() {
      if (actionIndex !== -1) {
        actions[actionIndex + 2] &= ~SUSPENDED;
      }
    }

    return utils.tryFinally(tryable, finalizer);
  }

  function suspendListeners(obj, eventNames, target, method, callback) {
    if (!method && "function" === typeof target) {
      method = target;
      target = null;
    }

    var suspendedActions = [];
    var actionsList = [];
    var eventName, actions, i, l;

    for (i = 0, l = eventNames.length; i < l; i++) {
      eventName = eventNames[i];
      actions = actionsFor(obj, eventName);
      var actionIndex = indexOf(actions, target, method);

      if (actionIndex !== -1) {
        actions[actionIndex + 2] |= SUSPENDED;
        suspendedActions.push(actionIndex);
        actionsList.push(actions);
      }
    }

    function tryable() {
      return callback.call(target);
    }

    function finalizer() {
      for (var i = 0, l = suspendedActions.length; i < l; i++) {
        var actionIndex = suspendedActions[i];
        actionsList[i][actionIndex + 2] &= ~SUSPENDED;
      }
    }

    return utils.tryFinally(tryable, finalizer);
  }

  function watchedEvents(obj) {
    var listeners = obj["__ember_meta__"].listeners;
    var ret = [];

    if (listeners) {
      for (var eventName in listeners) {
        if (eventName !== "__source__" && listeners[eventName]) {
          ret.push(eventName);
        }
      }
    }
    return ret;
  }

  function sendEvent(obj, eventName, params, actions) {
    // first give object a chance to handle it
    if (obj !== Ember['default'] && "function" === typeof obj.sendEvent) {
      obj.sendEvent(eventName, params);
    }

    if (!actions) {
      var meta = obj["__ember_meta__"];
      actions = meta && meta.listeners && meta.listeners[eventName];
    }

    if (!actions) {
      return;
    }

    for (var i = actions.length - 3; i >= 0; i -= 3) {
      // looping in reverse for once listeners
      var target = actions[i];
      var method = actions[i + 1];
      var flags = actions[i + 2];

      if (!method) {
        continue;
      }
      if (flags & SUSPENDED) {
        continue;
      }
      if (flags & ONCE) {
        removeListener(obj, eventName, target, method);
      }
      if (!target) {
        target = obj;
      }
      if ("string" === typeof method) {
        if (params) {
          utils.applyStr(target, method, params);
        } else {
          target[method]();
        }
      } else {
        if (params) {
          utils.apply(target, method, params);
        } else {
          method.call(target);
        }
      }
    }
    return true;
  }

  function hasListeners(obj, eventName) {
    var meta = obj["__ember_meta__"];
    var actions = meta && meta.listeners && meta.listeners[eventName];

    return !!(actions && actions.length);
  }

  function listenersFor(obj, eventName) {
    var ret = [];
    var meta = obj["__ember_meta__"];
    var actions = meta && meta.listeners && meta.listeners[eventName];

    if (!actions) {
      return ret;
    }

    for (var i = 0, l = actions.length; i < l; i += 3) {
      var target = actions[i];
      var method = actions[i + 1];
      ret.push([target, method]);
    }

    return ret;
  }

  function on() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var func = args.pop();
    var events = args;
    func.__ember_listens__ = events;
    return func;
  }

});
enifed('ember-metal/expand_properties', ['exports', 'ember-metal/error', 'ember-metal/array'], function (exports, EmberError, array) {

  'use strict';



  /**
    Expands `pattern`, invoking `callback` for each expansion.

    The only pattern supported is brace-expansion, anything else will be passed
    once to `callback` directly.

    Example

    ```js
    function echo(arg){ console.log(arg); }

    Ember.expandProperties('foo.bar', echo);              //=> 'foo.bar'
    Ember.expandProperties('{foo,bar}', echo);            //=> 'foo', 'bar'
    Ember.expandProperties('foo.{bar,baz}', echo);        //=> 'foo.bar', 'foo.baz'
    Ember.expandProperties('{foo,bar}.baz', echo);        //=> 'foo.baz', 'bar.baz'
    Ember.expandProperties('foo.{bar,baz}.@each', echo)   //=> 'foo.bar.@each', 'foo.baz.@each'
    Ember.expandProperties('{foo,bar}.{spam,eggs}', echo) //=> 'foo.spam', 'foo.eggs', 'bar.spam', 'bar.eggs'
    Ember.expandProperties('{foo}.bar.{baz}')             //=> 'foo.bar.baz'
    ```

    @method
    @private
    @param {String} pattern The property pattern to expand.
    @param {Function} callback The callback to invoke.  It is invoked once per
    expansion, and is passed the expansion.
    */
  exports['default'] = expandProperties;

  var SPLIT_REGEX = /\{|\}/;
  function expandProperties(pattern, callback) {
    if (pattern.indexOf(' ') > -1) {
      throw new EmberError['default']('Brace expanded properties cannot contain spaces, e.g. \'user.{firstName, lastName}\' should be \'user.{firstName,lastName}\'');
    }

    if ('string' === typeof pattern) {
      var parts = pattern.split(SPLIT_REGEX);
      var properties = [parts];

      array.forEach.call(parts, function (part, index) {
        if (part.indexOf(',') >= 0) {
          properties = duplicateAndReplace(properties, part.split(','), index);
        }
      });

      array.forEach.call(properties, function (property) {
        callback(property.join(''));
      });
    } else {
      callback(pattern);
    }
  }

  function duplicateAndReplace(properties, currentParts, index) {
    var all = [];

    array.forEach.call(properties, function (property) {
      array.forEach.call(currentParts, function (part) {
        var current = property.slice(0);
        current[index] = part;
        all.push(current);
      });
    });

    return all;
  }

});
enifed('ember-metal/get_properties', ['exports', 'ember-metal/property_get', 'ember-metal/utils'], function (exports, property_get, utils) {

  'use strict';



  /**
    To get multiple properties at once, call `Ember.getProperties`
    with an object followed by a list of strings or an array:

    ```javascript
    Ember.getProperties(record, 'firstName', 'lastName', 'zipCode');
    // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
    ```

    is equivalent to:

    ```javascript
    Ember.getProperties(record, ['firstName', 'lastName', 'zipCode']);
    // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
    ```

    @method getProperties
    @for Ember
    @param {Object} obj
    @param {String...|Array} list of keys to get
    @return {Object}
  */
  exports['default'] = getProperties;
  function getProperties(obj) {
    var ret = {};
    var propertyNames = arguments;
    var i = 1;

    if (arguments.length === 2 && utils.isArray(arguments[1])) {
      i = 0;
      propertyNames = arguments[1];
    }
    for (var len = propertyNames.length; i < len; i++) {
      ret[propertyNames[i]] = property_get.get(obj, propertyNames[i]);
    }
    return ret;
  }

});
enifed('ember-metal/injected_property', ['exports', 'ember-metal/core', 'ember-metal/computed', 'ember-metal/alias', 'ember-metal/properties', 'ember-metal/platform/create'], function (exports, Ember, computed, alias, properties, create) {

  'use strict';

  function InjectedProperty(type, name) {
    this.type = type;
    this.name = name;

    this._super$Constructor(injectedPropertyGet);
    AliasedPropertyPrototype.oneWay.call(this);
  }

  function injectedPropertyGet(keyName) {
    var possibleDesc = this[keyName];
    var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;

    Ember['default'].assert("Attempting to lookup an injected property on an object without a container, ensure that the object was instantiated via a container.", this.container);

    return this.container.lookup(desc.type + ":" + (desc.name || keyName));
  }

  InjectedProperty.prototype = create['default'](properties.Descriptor.prototype);

  var InjectedPropertyPrototype = InjectedProperty.prototype;
  var ComputedPropertyPrototype = computed.ComputedProperty.prototype;
  var AliasedPropertyPrototype = alias.AliasedProperty.prototype;

  InjectedPropertyPrototype._super$Constructor = computed.ComputedProperty;

  InjectedPropertyPrototype.get = ComputedPropertyPrototype.get;
  InjectedPropertyPrototype.readOnly = ComputedPropertyPrototype.readOnly;

  InjectedPropertyPrototype.teardown = ComputedPropertyPrototype.teardown;

  exports['default'] = InjectedProperty;

});
enifed('ember-metal/instrumentation', ['exports', 'ember-metal/core', 'ember-metal/utils'], function (exports, Ember, utils) {

  'use strict';

  exports.instrument = instrument;
  exports._instrumentStart = _instrumentStart;
  exports.subscribe = subscribe;
  exports.unsubscribe = unsubscribe;
  exports.reset = reset;

  /**
    Notifies event's subscribers, calls `before` and `after` hooks.

    @method instrument
    @namespace Ember.Instrumentation

    @param {String} [name] Namespaced event name.
    @param {Object} payload
    @param {Function} callback Function that you're instrumenting.
    @param {Object} binding Context that instrument function is called with.
  */
  var subscribers = [];
  var cache = {};

  var populateListeners = function (name) {
    var listeners = [];
    var subscriber;

    for (var i = 0, l = subscribers.length; i < l; i++) {
      subscriber = subscribers[i];
      if (subscriber.regex.test(name)) {
        listeners.push(subscriber.object);
      }
    }

    cache[name] = listeners;
    return listeners;
  };

  var time = (function () {
    var perf = "undefined" !== typeof window ? window.performance || {} : {};
    var fn = perf.now || perf.mozNow || perf.webkitNow || perf.msNow || perf.oNow;
    // fn.bind will be available in all the browsers that support the advanced window.performance... ;-)
    return fn ? fn.bind(perf) : function () {
      return +new Date();
    };
  })();
  function instrument(name, _payload, callback, binding) {
    if (arguments.length <= 3 && typeof _payload === "function") {
      binding = callback;
      callback = _payload;
      _payload = undefined;
    }
    if (subscribers.length === 0) {
      return callback.call(binding);
    }
    var payload = _payload || {};
    var finalizer = _instrumentStart(name, function () {
      return payload;
    });
    if (finalizer) {
      var tryable = function _instrumenTryable() {
        return callback.call(binding);
      };
      var catchable = function _instrumentCatchable(e) {
        payload.exception = e;
      };
      return utils.tryCatchFinally(tryable, catchable, finalizer);
    } else {
      return callback.call(binding);
    }
  }

  function _instrumentStart(name, _payload) {
    var listeners = cache[name];

    if (!listeners) {
      listeners = populateListeners(name);
    }

    if (listeners.length === 0) {
      return;
    }

    var payload = _payload();

    var STRUCTURED_PROFILE = Ember['default'].STRUCTURED_PROFILE;
    var timeName;
    if (STRUCTURED_PROFILE) {
      timeName = name + ": " + payload.object;
      console.time(timeName);
    }

    var l = listeners.length;
    var beforeValues = new Array(l);
    var i, listener;
    var timestamp = time();
    for (i = 0; i < l; i++) {
      listener = listeners[i];
      beforeValues[i] = listener.before(name, timestamp, payload);
    }

    return function _instrumentEnd() {
      var i, l, listener;
      var timestamp = time();
      for (i = 0, l = listeners.length; i < l; i++) {
        listener = listeners[i];
        listener.after(name, timestamp, payload, beforeValues[i]);
      }

      if (STRUCTURED_PROFILE) {
        console.timeEnd(timeName);
      }
    };
  }

  function subscribe(pattern, object) {
    var paths = pattern.split(".");
    var path;
    var regex = [];

    for (var i = 0, l = paths.length; i < l; i++) {
      path = paths[i];
      if (path === "*") {
        regex.push("[^\\.]*");
      } else {
        regex.push(path);
      }
    }

    regex = regex.join("\\.");
    regex = regex + "(\\..*)?";

    var subscriber = {
      pattern: pattern,
      regex: new RegExp("^" + regex + "$"),
      object: object
    };

    subscribers.push(subscriber);
    cache = {};

    return subscriber;
  }

  function unsubscribe(subscriber) {
    var index;

    for (var i = 0, l = subscribers.length; i < l; i++) {
      if (subscribers[i] === subscriber) {
        index = i;
      }
    }

    subscribers.splice(index, 1);
    cache = {};
  }

  function reset() {
    subscribers.length = 0;
    cache = {};
  }

  exports.subscribers = subscribers;

});
enifed('ember-metal/is_blank', ['exports', 'ember-metal/is_empty'], function (exports, isEmpty) {

  'use strict';



  /**
    A value is blank if it is empty or a whitespace string.

    ```javascript
    Ember.isBlank();                // true
    Ember.isBlank(null);            // true
    Ember.isBlank(undefined);       // true
    Ember.isBlank('');              // true
    Ember.isBlank([]);              // true
    Ember.isBlank('\n\t');          // true
    Ember.isBlank('  ');            // true
    Ember.isBlank({});              // false
    Ember.isBlank('\n\t Hello');    // false
    Ember.isBlank('Hello world');   // false
    Ember.isBlank([1,2,3]);         // false
    ```

    @method isBlank
    @for Ember
    @param {Object} obj Value to test
    @return {Boolean}
    @since 1.5.0
    */
  exports['default'] = isBlank;
  function isBlank(obj) {
    return isEmpty['default'](obj) || typeof obj === 'string' && obj.match(/\S/) === null;
  }

});
enifed('ember-metal/is_empty', ['exports', 'ember-metal/property_get', 'ember-metal/is_none'], function (exports, property_get, isNone) {

  'use strict';

  function isEmpty(obj) {
    var none = isNone['default'](obj);
    if (none) {
      return none;
    }

    if (typeof obj.size === 'number') {
      return !obj.size;
    }

    var objectType = typeof obj;

    if (objectType === 'object') {
      var size = property_get.get(obj, 'size');
      if (typeof size === 'number') {
        return !size;
      }
    }

    if (typeof obj.length === 'number' && objectType !== 'function') {
      return !obj.length;
    }

    if (objectType === 'object') {
      var length = property_get.get(obj, 'length');
      if (typeof length === 'number') {
        return !length;
      }
    }

    return false;
  }

  exports['default'] = isEmpty;

});
enifed('ember-metal/is_none', ['exports'], function (exports) {

  'use strict';

  /**
    Returns true if the passed value is null or undefined. This avoids errors
    from JSLint complaining about use of ==, which can be technically
    confusing.

    ```javascript
    Ember.isNone();              // true
    Ember.isNone(null);          // true
    Ember.isNone(undefined);     // true
    Ember.isNone('');            // false
    Ember.isNone([]);            // false
    Ember.isNone(function() {});  // false
    ```

    @method isNone
    @for Ember
    @param {Object} obj Value to test
    @return {Boolean}
  */
  function isNone(obj) {
    return obj === null || obj === undefined;
  }

  exports['default'] = isNone;

});
enifed('ember-metal/is_present', ['exports', 'ember-metal/is_blank'], function (exports, isBlank) {

  'use strict';



  /**
    A value is present if it not `isBlank`.

    ```javascript
    Ember.isPresent();                // false
    Ember.isPresent(null);            // false
    Ember.isPresent(undefined);       // false
    Ember.isPresent('');              // false
    Ember.isPresent([]);              // false
    Ember.isPresent('\n\t');          // false
    Ember.isPresent('  ');            // false
    Ember.isPresent({});              // true
    Ember.isPresent('\n\t Hello');    // true
    Ember.isPresent('Hello world');   // true
    Ember.isPresent([1,2,3]);         // true
    ```

    @method isPresent
    @for Ember
    @param {Object} obj Value to test
    @return {Boolean}
    @since 1.8.0
    */
  exports['default'] = isPresent;
  function isPresent(obj) {
    return !isBlank['default'](obj);
  }

});
enifed('ember-metal/keys', ['exports', 'ember-metal/platform/define_property'], function (exports, define_property) {

  'use strict';

  var keys = Object.keys;

  if (!keys || !define_property.canDefineNonEnumerableProperties) {
    // modified from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    keys = (function () {
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');
      var dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];
      var dontEnumsLength = dontEnums.length;

      return function keys(obj) {
        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [];
        var prop, i;

        for (prop in obj) {
          if (prop !== '_super' && prop.lastIndexOf('__', 0) !== 0 && hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    })();
  }

  exports['default'] = keys;

});
enifed('ember-metal/libraries', ['exports', 'ember-metal/core', 'ember-metal/enumerable_utils'], function (exports, Ember, enumerable_utils) {

  'use strict';

  function Libraries() {
    this._registry = [];
    this._coreLibIndex = 0;
  }

  Libraries.prototype = {
    constructor: Libraries,

    _getLibraryByName: function (name) {
      var libs = this._registry;
      var count = libs.length;

      for (var i = 0; i < count; i++) {
        if (libs[i].name === name) {
          return libs[i];
        }
      }
    },

    register: function (name, version, isCoreLibrary) {
      var index = this._registry.length;

      if (!this._getLibraryByName(name)) {
        if (isCoreLibrary) {
          index = this._coreLibIndex++;
        }
        this._registry.splice(index, 0, { name: name, version: version });
      } else {
        Ember['default'].warn("Library \"" + name + "\" is already registered with Ember.");
      }
    },

    registerCoreLibrary: function (name, version) {
      this.register(name, version, true);
    },

    deRegister: function (name) {
      var lib = this._getLibraryByName(name);
      var index;

      if (lib) {
        index = enumerable_utils.indexOf(this._registry, lib);
        this._registry.splice(index, 1);
      }
    },

    each: function (callback) {
      Ember['default'].deprecate("Using Ember.libraries.each() is deprecated. Access to a list of registered libraries is currently a private API. If you are not knowingly accessing this method, your out-of-date Ember Inspector may be doing so.");
      enumerable_utils.forEach(this._registry, function (lib) {
        callback(lib.name, lib.version);
      });
    }
  };

  
  exports['default'] = Libraries;

});
enifed('ember-metal/logger', ['exports', 'ember-metal/core', 'ember-metal/error'], function (exports, Ember, EmberError) {

  'use strict';

  function K() {
    return this;
  }

  function consoleMethod(name) {
    var consoleObj, logToConsole;
    if (Ember['default'].imports.console) {
      consoleObj = Ember['default'].imports.console;
    } else if (typeof console !== "undefined") {
      consoleObj = console;
    }

    var method = typeof consoleObj === "object" ? consoleObj[name] : null;

    if (method) {
      // Older IE doesn't support bind, but Chrome needs it
      if (typeof method.bind === "function") {
        logToConsole = method.bind(consoleObj);
        logToConsole.displayName = "console." + name;
        return logToConsole;
      } else if (typeof method.apply === "function") {
        logToConsole = function () {
          method.apply(consoleObj, arguments);
        };
        logToConsole.displayName = "console." + name;
        return logToConsole;
      } else {
        return function () {
          var message = Array.prototype.join.call(arguments, ", ");
          method(message);
        };
      }
    }
  }

  function assertPolyfill(test, message) {
    if (!test) {
      try {
        // attempt to preserve the stack
        throw new EmberError['default']("assertion failed: " + message);
      } catch (error) {
        setTimeout(function () {
          throw error;
        }, 0);
      }
    }
  }

  /**
    Inside Ember-Metal, simply uses the methods from `imports.console`.
    Override this to provide more robust logging functionality.

    @class Logger
    @namespace Ember
  */
  exports['default'] = {
    /**
     Logs the arguments to the console.
     You can pass as many arguments as you want and they will be joined together with a space.
       ```javascript
      var foo = 1;
      Ember.Logger.log('log value of foo:', foo);
      // "log value of foo: 1" will be printed to the console
      ```
      @method log
     @for Ember.Logger
     @param {*} arguments
    */
    log: consoleMethod("log") || K,

    /**
     Prints the arguments to the console with a warning icon.
     You can pass as many arguments as you want and they will be joined together with a space.
       ```javascript
      Ember.Logger.warn('Something happened!');
      // "Something happened!" will be printed to the console with a warning icon.
      ```
      @method warn
     @for Ember.Logger
     @param {*} arguments
    */
    warn: consoleMethod("warn") || K,

    /**
     Prints the arguments to the console with an error icon, red text and a stack trace.
     You can pass as many arguments as you want and they will be joined together with a space.
       ```javascript
      Ember.Logger.error('Danger! Danger!');
      // "Danger! Danger!" will be printed to the console in red text.
      ```
      @method error
     @for Ember.Logger
     @param {*} arguments
    */
    error: consoleMethod("error") || K,

    /**
     Logs the arguments to the console.
     You can pass as many arguments as you want and they will be joined together with a space.
       ```javascript
      var foo = 1;
      Ember.Logger.info('log value of foo:', foo);
      // "log value of foo: 1" will be printed to the console
      ```
      @method info
     @for Ember.Logger
     @param {*} arguments
    */
    info: consoleMethod("info") || K,

    /**
     Logs the arguments to the console in blue text.
     You can pass as many arguments as you want and they will be joined together with a space.
       ```javascript
      var foo = 1;
      Ember.Logger.debug('log value of foo:', foo);
      // "log value of foo: 1" will be printed to the console
      ```
      @method debug
     @for Ember.Logger
     @param {*} arguments
    */
    debug: consoleMethod("debug") || consoleMethod("info") || K,

    /**
     If the value passed into `Ember.Logger.assert` is not truthy it will throw an error with a stack trace.
       ```javascript
      Ember.Logger.assert(true); // undefined
      Ember.Logger.assert(true === false); // Throws an Assertion failed error.
      ```
      @method assert
     @for Ember.Logger
     @param {Boolean} bool Value to test
    */
    assert: consoleMethod("assert") || assertPolyfill
  };

});
enifed('ember-metal/map', ['exports', 'ember-metal/utils', 'ember-metal/array', 'ember-metal/platform/create', 'ember-metal/deprecate_property'], function (exports, utils, array, create, deprecate_property) {

  'use strict';

  exports.OrderedSet = OrderedSet;
  exports.Map = Map;
  exports.MapWithDefault = MapWithDefault;

  /**
  @module ember-metal
  */

  /*
    JavaScript (before ES6) does not have a Map implementation. Objects,
    which are often used as dictionaries, may only have Strings as keys.

    Because Ember has a way to get a unique identifier for every object
    via `Ember.guidFor`, we can implement a performant Map with arbitrary
    keys. Because it is commonly used in low-level bookkeeping, Map is
    implemented as a pure JavaScript object for performance.

    This implementation follows the current iteration of the ES6 proposal for
    maps (http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets),
    with one exception:  as we do not have the luxury of in-VM iteration, we implement a
    forEach method for iteration.

    Map is mocked out to look like an Ember object, so you can do
    `Ember.Map.create()` for symmetry with other Ember classes.
  */

  function missingFunction(fn) {
    throw new TypeError("" + Object.prototype.toString.call(fn) + " is not a function");
  }

  function missingNew(name) {
    throw new TypeError("Constructor " + name + " requires 'new'");
  }

  function copyNull(obj) {
    var output = create['default'](null);

    for (var prop in obj) {
      // hasOwnPropery is not needed because obj is Object.create(null);
      output[prop] = obj[prop];
    }

    return output;
  }

  function copyMap(original, newObject) {
    var keys = original._keys.copy();
    var values = copyNull(original._values);

    newObject._keys = keys;
    newObject._values = values;
    newObject.size = original.size;

    return newObject;
  }

  /**
    This class is used internally by Ember and Ember Data.
    Please do not use it at this time. We plan to clean it up
    and add many tests soon.

    @class OrderedSet
    @namespace Ember
    @constructor
    @private
  */
  function OrderedSet() {

    if (this instanceof OrderedSet) {
      this.clear();
      this._silenceRemoveDeprecation = false;
    } else {
      missingNew("OrderedSet");
    }
  }

  /**
    @method create
    @static
    @return {Ember.OrderedSet}
  */
  OrderedSet.create = function () {
    var Constructor = this;

    return new Constructor();
  };

  OrderedSet.prototype = {
    constructor: OrderedSet,
    /**
      @method clear
    */
    clear: function () {
      this.presenceSet = create['default'](null);
      this.list = [];
      this.size = 0;
    },

    /**
      @method add
      @param obj
      @param guid (optional, and for internal use)
      @return {Ember.OrderedSet}
    */
    add: function (obj, _guid) {
      var guid = _guid || utils.guidFor(obj);
      var presenceSet = this.presenceSet;
      var list = this.list;

      if (presenceSet[guid] !== true) {
        presenceSet[guid] = true;
        this.size = list.push(obj);
      }

      return this;
    },

    /**
      @deprecated
       @method remove
      @param obj
      @param _guid (optional and for internal use only)
      @return {Boolean}
    */
    remove: function (obj, _guid) {
      Ember.deprecate("Calling `OrderedSet.prototype.remove` has been deprecated, please use `OrderedSet.prototype.delete` instead.", this._silenceRemoveDeprecation);

      return this["delete"](obj, _guid);
    },

    /**
      @since 1.8.0
      @method delete
      @param obj
      @param _guid (optional and for internal use only)
      @return {Boolean}
    */
    "delete": function (obj, _guid) {
      var guid = _guid || utils.guidFor(obj);
      var presenceSet = this.presenceSet;
      var list = this.list;

      if (presenceSet[guid] === true) {
        delete presenceSet[guid];
        var index = array.indexOf.call(list, obj);
        if (index > -1) {
          list.splice(index, 1);
        }
        this.size = list.length;
        return true;
      } else {
        return false;
      }
    },

    /**
      @method isEmpty
      @return {Boolean}
    */
    isEmpty: function () {
      return this.size === 0;
    },

    /**
      @method has
      @param obj
      @return {Boolean}
    */
    has: function (obj) {
      if (this.size === 0) {
        return false;
      }

      var guid = utils.guidFor(obj);
      var presenceSet = this.presenceSet;

      return presenceSet[guid] === true;
    },

    /**
      @method forEach
      @param {Function} fn
      @param self
    */
    forEach: function (fn /*, ...thisArg*/) {
      if (typeof fn !== "function") {
        missingFunction(fn);
      }

      if (this.size === 0) {
        return;
      }

      var list = this.list;
      var length = arguments.length;
      var i;

      if (length === 2) {
        for (i = 0; i < list.length; i++) {
          fn.call(arguments[1], list[i]);
        }
      } else {
        for (i = 0; i < list.length; i++) {
          fn(list[i]);
        }
      }
    },

    /**
      @method toArray
      @return {Array}
    */
    toArray: function () {
      return this.list.slice();
    },

    /**
      @method copy
      @return {Ember.OrderedSet}
    */
    copy: function () {
      var Constructor = this.constructor;
      var set = new Constructor();

      set._silenceRemoveDeprecation = this._silenceRemoveDeprecation;
      set.presenceSet = copyNull(this.presenceSet);
      set.list = this.toArray();
      set.size = this.size;

      return set;
    }
  };

  deprecate_property.deprecateProperty(OrderedSet.prototype, "length", "size");

  /**
    A Map stores values indexed by keys. Unlike JavaScript's
    default Objects, the keys of a Map can be any JavaScript
    object.

    Internally, a Map has two data structures:

    1. `keys`: an OrderedSet of all of the existing keys
    2. `values`: a JavaScript Object indexed by the `Ember.guidFor(key)`

    When a key/value pair is added for the first time, we
    add the key to the `keys` OrderedSet, and create or
    replace an entry in `values`. When an entry is deleted,
    we delete its entry in `keys` and `values`.

    @class Map
    @namespace Ember
    @private
    @constructor
  */
  function Map() {
    if (this instanceof this.constructor) {
      this._keys = OrderedSet.create();
      this._keys._silenceRemoveDeprecation = true;
      this._values = create['default'](null);
      this.size = 0;
    } else {
      missingNew("OrderedSet");
    }
  }

  Ember.Map = Map;

  /**
    @method create
    @static
  */
  Map.create = function () {
    var Constructor = this;
    return new Constructor();
  };

  Map.prototype = {
    constructor: Map,

    /**
      This property will change as the number of objects in the map changes.
       @since 1.8.0
      @property size
      @type number
      @default 0
    */
    size: 0,

    /**
      Retrieve the value associated with a given key.
       @method get
      @param {*} key
      @return {*} the value associated with the key, or `undefined`
    */
    get: function (key) {
      if (this.size === 0) {
        return;
      }

      var values = this._values;
      var guid = utils.guidFor(key);

      return values[guid];
    },

    /**
      Adds a value to the map. If a value for the given key has already been
      provided, the new value will replace the old value.
       @method set
      @param {*} key
      @param {*} value
      @return {Ember.Map}
    */
    set: function (key, value) {
      var keys = this._keys;
      var values = this._values;
      var guid = utils.guidFor(key);

      // ensure we don't store -0
      var k = key === -0 ? 0 : key;

      keys.add(k, guid);

      values[guid] = value;

      this.size = keys.size;

      return this;
    },

    /**
      @deprecated see delete
      Removes a value from the map for an associated key.
       @method remove
      @param {*} key
      @return {Boolean} true if an item was removed, false otherwise
    */
    remove: function (key) {
      Ember.deprecate("Calling `Map.prototype.remove` has been deprecated, please use `Map.prototype.delete` instead.");

      return this["delete"](key);
    },

    /**
      Removes a value from the map for an associated key.
       @since 1.8.0
      @method delete
      @param {*} key
      @return {Boolean} true if an item was removed, false otherwise
    */
    "delete": function (key) {
      if (this.size === 0) {
        return false;
      }
      // don't use ES6 "delete" because it will be annoying
      // to use in browsers that are not ES6 friendly;
      var keys = this._keys;
      var values = this._values;
      var guid = utils.guidFor(key);

      if (keys["delete"](key, guid)) {
        delete values[guid];
        this.size = keys.size;
        return true;
      } else {
        return false;
      }
    },

    /**
      Check whether a key is present.
       @method has
      @param {*} key
      @return {Boolean} true if the item was present, false otherwise
    */
    has: function (key) {
      return this._keys.has(key);
    },

    /**
      Iterate over all the keys and values. Calls the function once
      for each key, passing in value, key, and the map being iterated over,
      in that order.
       The keys are guaranteed to be iterated over in insertion order.
       @method forEach
      @param {Function} callback
      @param {*} self if passed, the `this` value inside the
        callback. By default, `this` is the map.
    */
    forEach: function (callback /*, ...thisArg*/) {
      if (typeof callback !== "function") {
        missingFunction(callback);
      }

      if (this.size === 0) {
        return;
      }

      var length = arguments.length;
      var map = this;
      var cb, thisArg;

      if (length === 2) {
        thisArg = arguments[1];
        cb = function (key) {
          callback.call(thisArg, map.get(key), key, map);
        };
      } else {
        cb = function (key) {
          callback(map.get(key), key, map);
        };
      }

      this._keys.forEach(cb);
    },

    /**
      @method clear
    */
    clear: function () {
      this._keys.clear();
      this._values = create['default'](null);
      this.size = 0;
    },

    /**
      @method copy
      @return {Ember.Map}
    */
    copy: function () {
      return copyMap(this, new Map());
    }
  };

  deprecate_property.deprecateProperty(Map.prototype, "length", "size");

  /**
    @class MapWithDefault
    @namespace Ember
    @extends Ember.Map
    @private
    @constructor
    @param [options]
      @param {*} [options.defaultValue]
  */
  function MapWithDefault(options) {
    this._super$constructor();
    this.defaultValue = options.defaultValue;
  }

  /**
    @method create
    @static
    @param [options]
      @param {*} [options.defaultValue]
    @return {Ember.MapWithDefault|Ember.Map} If options are passed, returns
      `Ember.MapWithDefault` otherwise returns `Ember.Map`
  */
  MapWithDefault.create = function (options) {
    if (options) {
      return new MapWithDefault(options);
    } else {
      return new Map();
    }
  };

  MapWithDefault.prototype = create['default'](Map.prototype);
  MapWithDefault.prototype.constructor = MapWithDefault;
  MapWithDefault.prototype._super$constructor = Map;
  MapWithDefault.prototype._super$get = Map.prototype.get;

  /**
    Retrieve the value associated with a given key.

    @method get
    @param {*} key
    @return {*} the value associated with the key, or the default value
  */
  MapWithDefault.prototype.get = function (key) {
    var hasValue = this.has(key);

    if (hasValue) {
      return this._super$get(key);
    } else {
      var defaultValue = this.defaultValue(key);
      this.set(key, defaultValue);
      return defaultValue;
    }
  };

  /**
    @method copy
    @return {Ember.MapWithDefault}
  */
  MapWithDefault.prototype.copy = function () {
    var Constructor = this.constructor;
    return copyMap(this, new Constructor({
      defaultValue: this.defaultValue
    }));
  };

  exports['default'] = Map;

});
enifed('ember-metal/merge', ['exports', 'ember-metal/keys'], function (exports, keys) {

  'use strict';

  exports.assign = assign;

  /**
    Merge the contents of two objects together into the first object.

    ```javascript
    Ember.merge({first: 'Tom'}, {last: 'Dale'}); // {first: 'Tom', last: 'Dale'}
    var a = {first: 'Yehuda'};
    var b = {last: 'Katz'};
    Ember.merge(a, b); // a == {first: 'Yehuda', last: 'Katz'}, b == {last: 'Katz'}
    ```

    @method merge
    @for Ember
    @param {Object} original The object to merge into
    @param {Object} updates The object to copy properties from
    @return {Object}
  */
  exports['default'] = merge;

  function merge(original, updates) {
    if (!updates || typeof updates !== 'object') {
      return original;
    }

    var props = keys['default'](updates);
    var prop;
    var length = props.length;

    for (var i = 0; i < length; i++) {
      prop = props[i];
      original[prop] = updates[prop];
    }

    return original;
  }

  function assign(original) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    for (var i = 0, l = args.length; i < l; i++) {
      var arg = args[i];
      if (!arg) {
        continue;
      }

      for (var prop in arg) {
        if (arg.hasOwnProperty(prop)) {
          original[prop] = arg[prop];
        }
      }
    }

    return original;
  }

});
enifed('ember-metal/mixin', ['exports', 'ember-metal/core', 'ember-metal/merge', 'ember-metal/array', 'ember-metal/platform/create', 'ember-metal/property_get', 'ember-metal/property_set', 'ember-metal/utils', 'ember-metal/expand_properties', 'ember-metal/properties', 'ember-metal/computed', 'ember-metal/binding', 'ember-metal/observer', 'ember-metal/events', 'ember-metal/streams/utils'], function (exports, Ember, merge, array, o_create, property_get, property_set, utils, expandProperties, ember_metal__properties, computed, ember_metal__binding, ember_metal__observer, events, streams__utils) {

  
  exports.mixin = mixin;
  exports.required = required;
  exports.aliasMethod = aliasMethod;
  exports.observer = observer;
  exports.immediateObserver = immediateObserver;
  exports.beforeObserver = beforeObserver;
  exports.Mixin = Mixin;

  /**
    @method mixin
    @for Ember
    @param obj
    @param mixins*
    @return obj
  */
  "REMOVE_USE_STRICT: true";var REQUIRED;
  var a_slice = [].slice;

  function superFunction() {
    var func = this.__nextSuper;
    var ret;

    if (func) {
      var length = arguments.length;
      this.__nextSuper = null;
      if (length === 0) {
        ret = func.call(this);
      } else if (length === 1) {
        ret = func.call(this, arguments[0]);
      } else if (length === 2) {
        ret = func.call(this, arguments[0], arguments[1]);
      } else {
        ret = func.apply(this, arguments);
      }
      this.__nextSuper = func;
      return ret;
    }
  }

  // ensure we prime superFunction to mitigate
  // v8 bug potentially incorrectly deopts this function: https://code.google.com/p/v8/issues/detail?id=3709
  var primer = {
    __nextSuper: function (a, b, c, d) {}
  };

  superFunction.call(primer);
  superFunction.call(primer, 1);
  superFunction.call(primer, 1, 2);
  superFunction.call(primer, 1, 2, 3);

  function mixinsMeta(obj) {
    var m = utils.meta(obj, true);
    var ret = m.mixins;
    if (!ret) {
      ret = m.mixins = {};
    } else if (!m.hasOwnProperty("mixins")) {
      ret = m.mixins = o_create['default'](ret);
    }
    return ret;
  }

  function isMethod(obj) {
    return "function" === typeof obj && obj.isMethod !== false && obj !== Boolean && obj !== Object && obj !== Number && obj !== Array && obj !== Date && obj !== String;
  }

  var CONTINUE = {};

  function mixinProperties(mixinsMeta, mixin) {
    var guid;

    if (mixin instanceof Mixin) {
      guid = utils.guidFor(mixin);
      if (mixinsMeta[guid]) {
        return CONTINUE;
      }
      mixinsMeta[guid] = mixin;
      return mixin.properties;
    } else {
      return mixin; // apply anonymous mixin properties
    }
  }

  function concatenatedMixinProperties(concatProp, props, values, base) {
    var concats;

    // reset before adding each new mixin to pickup concats from previous
    concats = values[concatProp] || base[concatProp];
    if (props[concatProp]) {
      concats = concats ? concats.concat(props[concatProp]) : props[concatProp];
    }

    return concats;
  }

  function giveDescriptorSuper(meta, key, property, values, descs, base) {
    var superProperty;

    // Computed properties override methods, and do not call super to them
    if (values[key] === undefined) {
      // Find the original descriptor in a parent mixin
      superProperty = descs[key];
    }

    // If we didn't find the original descriptor in a parent mixin, find
    // it on the original object.
    if (!superProperty) {
      var possibleDesc = base[key];
      var superDesc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;

      superProperty = superDesc;
    }

    if (superProperty === undefined || !(superProperty instanceof computed.ComputedProperty)) {
      return property;
    }

    // Since multiple mixins may inherit from the same parent, we need
    // to clone the computed property so that other mixins do not receive
    // the wrapped version.
    property = o_create['default'](property);
    property._getter = utils.wrap(property._getter, superProperty._getter);
    if (superProperty._setter) {
      if (property._setter) {
        property._setter = utils.wrap(property._setter, superProperty._setter);
      } else {
        property._setter = superProperty._setter;
      }
    }

    return property;
  }

  var sourceAvailable = (function () {
    return this;
  }).toString().indexOf("return this;") > -1;

  function giveMethodSuper(obj, key, method, values, descs) {
    var superMethod;

    // Methods overwrite computed properties, and do not call super to them.
    if (descs[key] === undefined) {
      // Find the original method in a parent mixin
      superMethod = values[key];
    }

    // If we didn't find the original value in a parent mixin, find it in
    // the original object
    superMethod = superMethod || obj[key];

    // Only wrap the new method if the original method was a function
    if (superMethod === undefined || "function" !== typeof superMethod) {
      return method;
    }

    var hasSuper;
    if (sourceAvailable) {
      hasSuper = method.__hasSuper;

      if (hasSuper === undefined) {
        hasSuper = method.toString().indexOf("_super") > -1;
        method.__hasSuper = hasSuper;
      }
    }

    if (sourceAvailable === false || hasSuper) {
      return utils.wrap(method, superMethod);
    } else {
      return method;
    }
  }

  function applyConcatenatedProperties(obj, key, value, values) {
    var baseValue = values[key] || obj[key];

    if (baseValue) {
      if ("function" === typeof baseValue.concat) {
        if (value === null || value === undefined) {
          return baseValue;
        } else {
          return baseValue.concat(value);
        }
      } else {
        return utils.makeArray(baseValue).concat(value);
      }
    } else {
      return utils.makeArray(value);
    }
  }

  function applyMergedProperties(obj, key, value, values) {
    var baseValue = values[key] || obj[key];

    Ember['default'].assert("You passed in `" + JSON.stringify(value) + "` as the value for `" + key + "` but `" + key + "` cannot be an Array", !utils.isArray(value));

    if (!baseValue) {
      return value;
    }

    var newBase = merge['default']({}, baseValue);
    var hasFunction = false;

    for (var prop in value) {
      if (!value.hasOwnProperty(prop)) {
        continue;
      }

      var propValue = value[prop];
      if (isMethod(propValue)) {
        // TODO: support for Computed Properties, etc?
        hasFunction = true;
        newBase[prop] = giveMethodSuper(obj, prop, propValue, baseValue, {});
      } else {
        newBase[prop] = propValue;
      }
    }

    if (hasFunction) {
      newBase._super = superFunction;
    }

    return newBase;
  }

  function addNormalizedProperty(base, key, value, meta, descs, values, concats, mergings) {
    if (value instanceof ember_metal__properties.Descriptor) {
      if (value === REQUIRED && descs[key]) {
        return CONTINUE;
      }

      // Wrap descriptor function to implement
      // __nextSuper() if needed
      if (value._getter) {
        value = giveDescriptorSuper(meta, key, value, values, descs, base);
      }

      descs[key] = value;
      values[key] = undefined;
    } else {
      if (concats && array.indexOf.call(concats, key) >= 0 || key === "concatenatedProperties" || key === "mergedProperties") {
        value = applyConcatenatedProperties(base, key, value, values);
      } else if (mergings && array.indexOf.call(mergings, key) >= 0) {
        value = applyMergedProperties(base, key, value, values);
      } else if (isMethod(value)) {
        value = giveMethodSuper(base, key, value, values, descs);
      }

      descs[key] = undefined;
      values[key] = value;
    }
  }

  function mergeMixins(mixins, m, descs, values, base, keys) {
    var currentMixin, props, key, concats, mergings, meta;

    function removeKeys(keyName) {
      delete descs[keyName];
      delete values[keyName];
    }

    for (var i = 0, l = mixins.length; i < l; i++) {
      currentMixin = mixins[i];
      Ember['default'].assert("Expected hash or Mixin instance, got " + Object.prototype.toString.call(currentMixin), typeof currentMixin === "object" && currentMixin !== null && Object.prototype.toString.call(currentMixin) !== "[object Array]");

      props = mixinProperties(m, currentMixin);
      if (props === CONTINUE) {
        continue;
      }

      if (props) {
        meta = utils.meta(base);
        if (base.willMergeMixin) {
          base.willMergeMixin(props);
        }
        concats = concatenatedMixinProperties("concatenatedProperties", props, values, base);
        mergings = concatenatedMixinProperties("mergedProperties", props, values, base);

        for (key in props) {
          if (!props.hasOwnProperty(key)) {
            continue;
          }
          keys.push(key);
          addNormalizedProperty(base, key, props[key], meta, descs, values, concats, mergings);
        }

        // manually copy toString() because some JS engines do not enumerate it
        if (props.hasOwnProperty("toString")) {
          base.toString = props.toString;
        }
      } else if (currentMixin.mixins) {
        mergeMixins(currentMixin.mixins, m, descs, values, base, keys);
        if (currentMixin._without) {
          array.forEach.call(currentMixin._without, removeKeys);
        }
      }
    }
  }

  var IS_BINDING = /^.+Binding$/;

  function detectBinding(obj, key, value, m) {
    if (IS_BINDING.test(key)) {
      var bindings = m.bindings;
      if (!bindings) {
        bindings = m.bindings = {};
      } else if (!m.hasOwnProperty("bindings")) {
        bindings = m.bindings = o_create['default'](m.bindings);
      }
      bindings[key] = value;
    }
  }

  function connectStreamBinding(obj, key, stream) {
    var onNotify = function (stream) {
      ember_metal__observer._suspendObserver(obj, key, null, didChange, function () {
        property_set.trySet(obj, key, stream.value());
      });
    };

    var didChange = function () {
      stream.setValue(property_get.get(obj, key), onNotify);
    };

    // Initialize value
    property_set.set(obj, key, stream.value());

    ember_metal__observer.addObserver(obj, key, null, didChange);

    stream.subscribe(onNotify);

    if (obj._streamBindingSubscriptions === undefined) {
      obj._streamBindingSubscriptions = o_create['default'](null);
    }

    obj._streamBindingSubscriptions[key] = onNotify;
  }

  function connectBindings(obj, m) {
    // TODO Mixin.apply(instance) should disconnect binding if exists
    var bindings = m.bindings;
    var key, binding, to;
    if (bindings) {
      for (key in bindings) {
        binding = bindings[key];
        if (binding) {
          to = key.slice(0, -7); // strip Binding off end
          if (streams__utils.isStream(binding)) {
            connectStreamBinding(obj, to, binding);
            continue;
          } else if (binding instanceof ember_metal__binding.Binding) {
            binding = binding.copy(); // copy prototypes' instance
            binding.to(to);
          } else {
            // binding is string path
            binding = new ember_metal__binding.Binding(to, binding);
          }
          binding.connect(obj);
          obj[key] = binding;
        }
      }
      // mark as applied
      m.bindings = {};
    }
  }

  function finishPartial(obj, m) {
    connectBindings(obj, m || utils.meta(obj));
    return obj;
  }

  function followAlias(obj, desc, m, descs, values) {
    var altKey = desc.methodName;
    var value;
    var possibleDesc;
    if (descs[altKey] || values[altKey]) {
      value = values[altKey];
      desc = descs[altKey];
    } else if ((possibleDesc = obj[altKey]) && possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor) {
      desc = possibleDesc;
      value = undefined;
    } else {
      desc = undefined;
      value = obj[altKey];
    }

    return { desc: desc, value: value };
  }

  function updateObserversAndListeners(obj, key, observerOrListener, pathsKey, updateMethod) {
    var paths = observerOrListener[pathsKey];

    if (paths) {
      for (var i = 0, l = paths.length; i < l; i++) {
        updateMethod(obj, paths[i], null, key);
      }
    }
  }

  function replaceObserversAndListeners(obj, key, observerOrListener) {
    var prev = obj[key];

    if ("function" === typeof prev) {
      updateObserversAndListeners(obj, key, prev, "__ember_observesBefore__", ember_metal__observer.removeBeforeObserver);
      updateObserversAndListeners(obj, key, prev, "__ember_observes__", ember_metal__observer.removeObserver);
      updateObserversAndListeners(obj, key, prev, "__ember_listens__", events.removeListener);
    }

    if ("function" === typeof observerOrListener) {
      updateObserversAndListeners(obj, key, observerOrListener, "__ember_observesBefore__", ember_metal__observer.addBeforeObserver);
      updateObserversAndListeners(obj, key, observerOrListener, "__ember_observes__", ember_metal__observer.addObserver);
      updateObserversAndListeners(obj, key, observerOrListener, "__ember_listens__", events.addListener);
    }
  }

  function applyMixin(obj, mixins, partial) {
    var descs = {};
    var values = {};
    var m = utils.meta(obj);
    var keys = [];
    var key, value, desc;

    obj._super = superFunction;

    // Go through all mixins and hashes passed in, and:
    //
    // * Handle concatenated properties
    // * Handle merged properties
    // * Set up _super wrapping if necessary
    // * Set up computed property descriptors
    // * Copying `toString` in broken browsers
    mergeMixins(mixins, mixinsMeta(obj), descs, values, obj, keys);

    for (var i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      if (key === "constructor" || !values.hasOwnProperty(key)) {
        continue;
      }

      desc = descs[key];
      value = values[key];

      if (desc === REQUIRED) {
        continue;
      }

      while (desc && desc instanceof Alias) {
        var followed = followAlias(obj, desc, m, descs, values);
        desc = followed.desc;
        value = followed.value;
      }

      if (desc === undefined && value === undefined) {
        continue;
      }

      replaceObserversAndListeners(obj, key, value);
      detectBinding(obj, key, value, m);
      ember_metal__properties.defineProperty(obj, key, desc, value, m);
    }

    if (!partial) {
      // don't apply to prototype
      finishPartial(obj, m);
    }

    return obj;
  }
  function mixin(obj) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    applyMixin(obj, args, false);
    return obj;
  }

  /**
    The `Ember.Mixin` class allows you to create mixins, whose properties can be
    added to other classes. For instance,

    ```javascript
    App.Editable = Ember.Mixin.create({
      edit: function() {
        console.log('starting to edit');
        this.set('isEditing', true);
      },
      isEditing: false
    });

    // Mix mixins into classes by passing them as the first arguments to
    // .extend.
    App.CommentView = Ember.View.extend(App.Editable, {
      template: Ember.Handlebars.compile('{{#if view.isEditing}}...{{else}}...{{/if}}')
    });

    commentView = App.CommentView.create();
    commentView.edit(); // outputs 'starting to edit'
    ```

    Note that Mixins are created with `Ember.Mixin.create`, not
    `Ember.Mixin.extend`.

    Note that mixins extend a constructor's prototype so arrays and object literals
    defined as properties will be shared amongst objects that implement the mixin.
    If you want to define a property in a mixin that is not shared, you can define
    it either as a computed property or have it be created on initialization of the object.

    ```javascript
    //filters array will be shared amongst any object implementing mixin
    App.Filterable = Ember.Mixin.create({
      filters: Ember.A()
    });

    //filters will be a separate  array for every object implementing the mixin
    App.Filterable = Ember.Mixin.create({
      filters: Ember.computed(function() {return Ember.A();})
    });

    //filters will be created as a separate array during the object's initialization
    App.Filterable = Ember.Mixin.create({
      init: function() {
        this._super.apply(this, arguments);
        this.set("filters", Ember.A());
      }
    });
    ```

    @class Mixin
    @namespace Ember
  */
  exports['default'] = Mixin;
  function Mixin(args, properties) {
    this.properties = properties;

    var length = args && args.length;

    if (length > 0) {
      var m = new Array(length);

      for (var i = 0; i < length; i++) {
        var x = args[i];
        if (x instanceof Mixin) {
          m[i] = x;
        } else {
          m[i] = new Mixin(undefined, x);
        }
      }

      this.mixins = m;
    } else {
      this.mixins = undefined;
    }
    this.ownerConstructor = undefined;
  }

  Mixin._apply = applyMixin;

  Mixin.applyPartial = function (obj) {
    var args = a_slice.call(arguments, 1);
    return applyMixin(obj, args, true);
  };

  Mixin.finishPartial = finishPartial;

  // ES6TODO: this relies on a global state?
  Ember['default'].anyUnprocessedMixins = false;

  /**
    @method create
    @static
    @param arguments*
  */
  Mixin.create = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    // ES6TODO: this relies on a global state?
    Ember['default'].anyUnprocessedMixins = true;
    var M = this;
    return new M(args, undefined);
  };

  var MixinPrototype = Mixin.prototype;

  /**
    @method reopen
    @param arguments*
  */
  MixinPrototype.reopen = function () {
    var currentMixin;

    if (this.properties) {
      currentMixin = new Mixin(undefined, this.properties);
      this.properties = undefined;
      this.mixins = [currentMixin];
    } else if (!this.mixins) {
      this.mixins = [];
    }

    var len = arguments.length;
    var mixins = this.mixins;
    var idx;

    for (idx = 0; idx < len; idx++) {
      currentMixin = arguments[idx];
      Ember['default'].assert("Expected hash or Mixin instance, got " + Object.prototype.toString.call(currentMixin), typeof currentMixin === "object" && currentMixin !== null && Object.prototype.toString.call(currentMixin) !== "[object Array]");

      if (currentMixin instanceof Mixin) {
        mixins.push(currentMixin);
      } else {
        mixins.push(new Mixin(undefined, currentMixin));
      }
    }

    return this;
  };

  /**
    @method apply
    @param obj
    @return applied object
  */
  MixinPrototype.apply = function (obj) {
    return applyMixin(obj, [this], false);
  };

  MixinPrototype.applyPartial = function (obj) {
    return applyMixin(obj, [this], true);
  };

  function _detect(curMixin, targetMixin, seen) {
    var guid = utils.guidFor(curMixin);

    if (seen[guid]) {
      return false;
    }
    seen[guid] = true;

    if (curMixin === targetMixin) {
      return true;
    }
    var mixins = curMixin.mixins;
    var loc = mixins ? mixins.length : 0;
    while (--loc >= 0) {
      if (_detect(mixins[loc], targetMixin, seen)) {
        return true;
      }
    }
    return false;
  }

  /**
    @method detect
    @param obj
    @return {Boolean}
  */
  MixinPrototype.detect = function (obj) {
    if (!obj) {
      return false;
    }
    if (obj instanceof Mixin) {
      return _detect(obj, this, {});
    }
    var m = obj["__ember_meta__"];
    var mixins = m && m.mixins;
    if (mixins) {
      return !!mixins[utils.guidFor(this)];
    }
    return false;
  };

  MixinPrototype.without = function () {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var ret = new Mixin([this]);
    ret._without = args;
    return ret;
  };

  function _keys(ret, mixin, seen) {
    if (seen[utils.guidFor(mixin)]) {
      return;
    }
    seen[utils.guidFor(mixin)] = true;

    if (mixin.properties) {
      var props = mixin.properties;
      for (var key in props) {
        if (props.hasOwnProperty(key)) {
          ret[key] = true;
        }
      }
    } else if (mixin.mixins) {
      array.forEach.call(mixin.mixins, function (x) {
        _keys(ret, x, seen);
      });
    }
  }

  MixinPrototype.keys = function () {
    var keys = {};
    var seen = {};
    var ret = [];
    _keys(keys, this, seen);
    for (var key in keys) {
      if (keys.hasOwnProperty(key)) {
        ret.push(key);
      }
    }
    return ret;
  };

  // returns the mixins currently applied to the specified object
  // TODO: Make Ember.mixin
  Mixin.mixins = function (obj) {
    var m = obj["__ember_meta__"];
    var mixins = m && m.mixins;
    var ret = [];

    if (!mixins) {
      return ret;
    }

    for (var key in mixins) {
      var currentMixin = mixins[key];

      // skip primitive mixins since these are always anonymous
      if (!currentMixin.properties) {
        ret.push(currentMixin);
      }
    }

    return ret;
  };

  REQUIRED = new ember_metal__properties.Descriptor();
  REQUIRED.toString = function () {
    return "(Required Property)";
  };
  function required() {
    Ember['default'].deprecate("Ember.required is deprecated as its behavior is inconsistent and unreliable.", false);
    return REQUIRED;
  }

  function Alias(methodName) {
    this.isDescriptor = true;
    this.methodName = methodName;
  }

  Alias.prototype = new ember_metal__properties.Descriptor();
  function aliasMethod(methodName) {
    return new Alias(methodName);
  }

  function observer() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    var func = args.slice(-1)[0];
    var paths;

    var addWatchedProperty = function (path) {
      paths.push(path);
    };
    var _paths = args.slice(0, -1);

    if (typeof func !== "function") {
      // revert to old, soft-deprecated argument ordering

      func = args[0];
      _paths = args.slice(1);
    }

    paths = [];

    for (var i = 0; i < _paths.length; ++i) {
      expandProperties['default'](_paths[i], addWatchedProperty);
    }

    if (typeof func !== "function") {
      throw new Ember['default'].Error("Ember.observer called without a function");
    }

    func.__ember_observes__ = paths;
    return func;
  }

  function immediateObserver() {
    for (var i = 0, l = arguments.length; i < l; i++) {
      var arg = arguments[i];
      Ember['default'].assert("Immediate observers must observe internal properties only, not properties on other objects.", typeof arg !== "string" || arg.indexOf(".") === -1);
    }

    return observer.apply(this, arguments);
  }

  function beforeObserver() {
    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    var func = args.slice(-1)[0];
    var paths;

    var addWatchedProperty = function (path) {
      paths.push(path);
    };

    var _paths = args.slice(0, -1);

    if (typeof func !== "function") {
      // revert to old, soft-deprecated argument ordering

      func = args[0];
      _paths = args.slice(1);
    }

    paths = [];

    for (var i = 0; i < _paths.length; ++i) {
      expandProperties['default'](_paths[i], addWatchedProperty);
    }

    if (typeof func !== "function") {
      throw new Ember['default'].Error("Ember.beforeObserver called without a function");
    }

    func.__ember_observesBefore__ = paths;
    return func;
  }

  exports.IS_BINDING = IS_BINDING;
  exports.REQUIRED = REQUIRED;

});
enifed('ember-metal/observer', ['exports', 'ember-metal/watching', 'ember-metal/array', 'ember-metal/events'], function (exports, watching, array, ember_metal__events) {

  'use strict';

  exports.addObserver = addObserver;
  exports.observersFor = observersFor;
  exports.removeObserver = removeObserver;
  exports.addBeforeObserver = addBeforeObserver;
  exports._suspendBeforeObserver = _suspendBeforeObserver;
  exports._suspendObserver = _suspendObserver;
  exports._suspendBeforeObservers = _suspendBeforeObservers;
  exports._suspendObservers = _suspendObservers;
  exports.beforeObserversFor = beforeObserversFor;
  exports.removeBeforeObserver = removeBeforeObserver;

  /**
    @method addObserver
    @for Ember
    @param obj
    @param {String} path
    @param {Object|Function} targetOrMethod
    @param {Function|String} [method]
  */
  var AFTER_OBSERVERS = ":change";
  var BEFORE_OBSERVERS = ":before";

  function changeEvent(keyName) {
    return keyName + AFTER_OBSERVERS;
  }

  function beforeEvent(keyName) {
    return keyName + BEFORE_OBSERVERS;
  }
  function addObserver(obj, _path, target, method) {
    ember_metal__events.addListener(obj, changeEvent(_path), target, method);
    watching.watch(obj, _path);

    return this;
  }

  function observersFor(obj, path) {
    return ember_metal__events.listenersFor(obj, changeEvent(path));
  }

  function removeObserver(obj, path, target, method) {
    watching.unwatch(obj, path);
    ember_metal__events.removeListener(obj, changeEvent(path), target, method);

    return this;
  }

  function addBeforeObserver(obj, path, target, method) {
    ember_metal__events.addListener(obj, beforeEvent(path), target, method);
    watching.watch(obj, path);

    return this;
  }

  function _suspendBeforeObserver(obj, path, target, method, callback) {
    return ember_metal__events.suspendListener(obj, beforeEvent(path), target, method, callback);
  }

  function _suspendObserver(obj, path, target, method, callback) {
    return ember_metal__events.suspendListener(obj, changeEvent(path), target, method, callback);
  }

  function _suspendBeforeObservers(obj, paths, target, method, callback) {
    var events = array.map.call(paths, beforeEvent);
    return ember_metal__events.suspendListeners(obj, events, target, method, callback);
  }

  function _suspendObservers(obj, paths, target, method, callback) {
    var events = array.map.call(paths, changeEvent);
    return ember_metal__events.suspendListeners(obj, events, target, method, callback);
  }

  function beforeObserversFor(obj, path) {
    return ember_metal__events.listenersFor(obj, beforeEvent(path));
  }

  function removeBeforeObserver(obj, path, target, method) {
    watching.unwatch(obj, path);
    ember_metal__events.removeListener(obj, beforeEvent(path), target, method);

    return this;
  }

});
enifed('ember-metal/observer_set', ['exports', 'ember-metal/utils', 'ember-metal/events'], function (exports, utils, events) {

  'use strict';

  exports['default'] = ObserverSet;
  function ObserverSet() {
    this.clear();
  }

  ObserverSet.prototype.add = function (sender, keyName, eventName) {
    var observerSet = this.observerSet;
    var observers = this.observers;
    var senderGuid = utils.guidFor(sender);
    var keySet = observerSet[senderGuid];
    var index;

    if (!keySet) {
      observerSet[senderGuid] = keySet = {};
    }
    index = keySet[keyName];
    if (index === undefined) {
      index = observers.push({
        sender: sender,
        keyName: keyName,
        eventName: eventName,
        listeners: []
      }) - 1;
      keySet[keyName] = index;
    }
    return observers[index].listeners;
  };

  ObserverSet.prototype.flush = function () {
    var observers = this.observers;
    var i, len, observer, sender;
    this.clear();
    for (i = 0, len = observers.length; i < len; ++i) {
      observer = observers[i];
      sender = observer.sender;
      if (sender.isDestroying || sender.isDestroyed) {
        continue;
      }
      events.sendEvent(sender, observer.eventName, [sender, observer.keyName], observer.listeners);
    }
  };

  ObserverSet.prototype.clear = function () {
    this.observerSet = {};
    this.observers = [];
  };

});
enifed('ember-metal/path_cache', ['exports', 'ember-metal/cache'], function (exports, Cache) {

  'use strict';

  exports.isGlobal = isGlobal;
  exports.isGlobalPath = isGlobalPath;
  exports.hasThis = hasThis;
  exports.isPath = isPath;
  exports.getFirstKey = getFirstKey;
  exports.getTailPath = getTailPath;

  var IS_GLOBAL = /^[A-Z$]/;
  var IS_GLOBAL_PATH = /^[A-Z$].*[\.]/;
  var HAS_THIS = 'this.';

  var isGlobalCache = new Cache['default'](1000, function (key) {
    return IS_GLOBAL.test(key);
  });

  var isGlobalPathCache = new Cache['default'](1000, function (key) {
    return IS_GLOBAL_PATH.test(key);
  });

  var hasThisCache = new Cache['default'](1000, function (key) {
    return key.lastIndexOf(HAS_THIS, 0) === 0;
  });

  var firstDotIndexCache = new Cache['default'](1000, function (key) {
    return key.indexOf('.');
  });

  var firstKeyCache = new Cache['default'](1000, function (path) {
    var index = firstDotIndexCache.get(path);
    if (index === -1) {
      return path;
    } else {
      return path.slice(0, index);
    }
  });

  var tailPathCache = new Cache['default'](1000, function (path) {
    var index = firstDotIndexCache.get(path);
    if (index !== -1) {
      return path.slice(index + 1);
    }
  });

  var caches = {
    isGlobalCache: isGlobalCache,
    isGlobalPathCache: isGlobalPathCache,
    hasThisCache: hasThisCache,
    firstDotIndexCache: firstDotIndexCache,
    firstKeyCache: firstKeyCache,
    tailPathCache: tailPathCache
  };function isGlobal(path) {
    return isGlobalCache.get(path);
  }

  function isGlobalPath(path) {
    return isGlobalPathCache.get(path);
  }

  function hasThis(path) {
    return hasThisCache.get(path);
  }

  function isPath(path) {
    return firstDotIndexCache.get(path) !== -1;
  }

  function getFirstKey(path) {
    return firstKeyCache.get(path);
  }

  function getTailPath(path) {
    return tailPathCache.get(path);
  }

  exports.caches = caches;

});
enifed('ember-metal/platform/create', ['exports', 'ember-metal/platform/define_properties'], function (exports, defineProperties) {

  


  'REMOVE_USE_STRICT: true'; /**
                             @class platform
                             @namespace Ember
                             @static
                             */

  /**
    Identical to `Object.create()`. Implements if not available natively.

    @since 1.8.0
    @method create
    @for Ember
  */
  var create;
  // ES5 15.2.3.5
  // http://es5.github.com/#x15.2.3.5
  if (!(Object.create && !Object.create(null).hasOwnProperty)) {
    /* jshint scripturl:true, proto:true */
    // Contributed by Brandon Benvie, October, 2012
    var createEmpty;
    var supportsProto = !({ '__proto__': null } instanceof Object);
    // the following produces false positives
    // in Opera Mini => not a reliable check
    // Object.prototype.__proto__ === null
    if (supportsProto || typeof document === 'undefined') {
      createEmpty = function () {
        return { '__proto__': null };
      };
    } else {
      // In old IE __proto__ can't be used to manually set `null`, nor does
      // any other method exist to make an object that inherits from nothing,
      // aside from Object.prototype itself. Instead, create a new global
      // object and *steal* its Object.prototype and strip it bare. This is
      // used as the prototype to create nullary objects.
      createEmpty = function () {
        var iframe = document.createElement('iframe');
        var parent = document.body || document.documentElement;
        iframe.style.display = 'none';
        parent.appendChild(iframe);
        iframe.src = 'javascript:';
        var empty = iframe.contentWindow.Object.prototype;
        parent.removeChild(iframe);
        iframe = null;
        delete empty.constructor;
        delete empty.hasOwnProperty;
        delete empty.propertyIsEnumerable;
        delete empty.isPrototypeOf;
        delete empty.toLocaleString;
        delete empty.toString;
        delete empty.valueOf;

        function Empty() {}
        Empty.prototype = empty;
        // short-circuit future calls
        createEmpty = function () {
          return new Empty();
        };
        return new Empty();
      };
    }

    create = Object.create = function create(prototype, properties) {

      var object;
      function Type() {} // An empty constructor.

      if (prototype === null) {
        object = createEmpty();
      } else {
        if (typeof prototype !== 'object' && typeof prototype !== 'function') {
          // In the native implementation `parent` can be `null`
          // OR *any* `instanceof Object`  (Object|Function|Array|RegExp|etc)
          // Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
          // like they are in modern browsers. Using `Object.create` on DOM elements
          // is...err...probably inappropriate, but the native version allows for it.
          throw new TypeError('Object prototype may only be an Object or null'); // same msg as Chrome
        }

        Type.prototype = prototype;

        object = new Type();
      }

      if (properties !== undefined) {
        defineProperties['default'](object, properties);
      }

      return object;
    };
  } else {
    create = Object.create;
  }

  exports['default'] = create;

});
enifed('ember-metal/platform/define_properties', ['exports', 'ember-metal/platform/define_property'], function (exports, define_property) {

  'use strict';

  var defineProperties = Object.defineProperties;

  // ES5 15.2.3.7
  // http://es5.github.com/#x15.2.3.7
  if (!defineProperties) {
    defineProperties = function defineProperties(object, properties) {
      for (var property in properties) {
        if (properties.hasOwnProperty(property) && property !== "__proto__") {
          define_property.defineProperty(object, property, properties[property]);
        }
      }
      return object;
    };

    Object.defineProperties = defineProperties;
  }

  exports['default'] = defineProperties;

});
enifed('ember-metal/platform/define_property', ['exports'], function (exports) {

  'use strict';

  /*globals Node */

  /**
  @class platform
  @namespace Ember
  @static
  */

  /**
    Set to true if the platform supports native getters and setters.

    @property hasPropertyAccessors
    @final
  */

  /**
    Identical to `Object.defineProperty()`. Implements as much functionality
    as possible if not available natively.

    @method defineProperty
    @param {Object} obj The object to modify
    @param {String} keyName property name to modify
    @param {Object} desc descriptor hash
    @return {void}
  */
  var defineProperty = (function checkCompliance(defineProperty) {
    if (!defineProperty) {
      return;
    }

    try {
      var a = 5;
      var obj = {};
      defineProperty(obj, 'a', {
        configurable: true,
        enumerable: true,
        get: function () {
          return a;
        },
        set: function (v) {
          a = v;
        }
      });
      if (obj.a !== 5) {
        return;
      }

      obj.a = 10;
      if (a !== 10) {
        return;
      }

      // check non-enumerability
      defineProperty(obj, 'a', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: true
      });
      for (var key in obj) {
        if (key === 'a') {
          return;
        }
      }

      // Detects a bug in Android <3.2 where you cannot redefine a property using
      // Object.defineProperty once accessors have already been set.
      if (obj.a !== true) {
        return;
      }

      // Detects a bug in Android <3 where redefining a property without a value changes the value
      // Object.defineProperty once accessors have already been set.
      defineProperty(obj, 'a', {
        enumerable: false
      });
      if (obj.a !== true) {
        return;
      }

      // defineProperty is compliant
      return defineProperty;
    } catch (e) {
      // IE8 defines Object.defineProperty but calling it on an Object throws
      return;
    }
  })(Object.defineProperty);

  var hasES5CompliantDefineProperty = !!defineProperty;

  if (hasES5CompliantDefineProperty && typeof document !== 'undefined') {
    // This is for Safari 5.0, which supports Object.defineProperty, but not
    // on DOM nodes.
    var canDefinePropertyOnDOM = (function () {
      try {
        defineProperty(document.createElement('div'), 'definePropertyOnDOM', {});
        return true;
      } catch (e) {}

      return false;
    })();

    if (!canDefinePropertyOnDOM) {
      defineProperty = function (obj, keyName, desc) {
        var isNode;

        if (typeof Node === 'object') {
          isNode = obj instanceof Node;
        } else {
          isNode = typeof obj === 'object' && typeof obj.nodeType === 'number' && typeof obj.nodeName === 'string';
        }

        if (isNode) {
          // TODO: Should we have a warning here?
          return obj[keyName] = desc.value;
        } else {
          return Object.defineProperty(obj, keyName, desc);
        }
      };
    }
  }

  if (!hasES5CompliantDefineProperty) {
    defineProperty = function definePropertyPolyfill(obj, keyName, desc) {
      if (!desc.get) {
        obj[keyName] = desc.value;
      }
    };
  }

  var hasPropertyAccessors = hasES5CompliantDefineProperty;
  var canDefineNonEnumerableProperties = hasES5CompliantDefineProperty;

  exports.hasES5CompliantDefineProperty = hasES5CompliantDefineProperty;
  exports.defineProperty = defineProperty;
  exports.hasPropertyAccessors = hasPropertyAccessors;
  exports.canDefineNonEnumerableProperties = canDefineNonEnumerableProperties;

});
enifed('ember-metal/properties', ['exports', 'ember-metal/core', 'ember-metal/utils', 'ember-metal/platform/define_property', 'ember-metal/property_events'], function (exports, Ember, utils, define_property, property_events) {

  'use strict';

  exports.Descriptor = Descriptor;
  exports.MANDATORY_SETTER_FUNCTION = MANDATORY_SETTER_FUNCTION;
  exports.DEFAULT_GETTER_FUNCTION = DEFAULT_GETTER_FUNCTION;
  exports.defineProperty = defineProperty;

  // ..........................................................
  // DESCRIPTOR
  //

  /**
    Objects of this type can implement an interface to respond to requests to
    get and set. The default implementation handles simple properties.
  */
  function Descriptor() {
    this.isDescriptor = true;
  }

  function MANDATORY_SETTER_FUNCTION(name) {
    return function SETTER_FUNCTION(value) {
      Ember['default'].assert("You must use Ember.set() to set the `" + name + "` property (of " + this + ") to `" + value + "`.", false);
    };
  }

  function DEFAULT_GETTER_FUNCTION(name) {
    return function GETTER_FUNCTION() {
      var meta = this["__ember_meta__"];
      return meta && meta.values[name];
    };
  }

  function defineProperty(obj, keyName, desc, data, meta) {
    var possibleDesc, existingDesc, watching, value;

    if (!meta) {
      meta = utils.meta(obj);
    }
    var watchEntry = meta.watching[keyName];
    possibleDesc = obj[keyName];
    existingDesc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;

    watching = watchEntry !== undefined && watchEntry > 0;

    if (existingDesc) {
      existingDesc.teardown(obj, keyName);
    }

    if (desc instanceof Descriptor) {
      value = desc;

      
        if (watching && define_property.hasPropertyAccessors) {
          define_property.defineProperty(obj, keyName, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: value
          });
        } else {
          obj[keyName] = value;
        }
            if (desc.setup) {
        desc.setup(obj, keyName);
      }
    } else {
      if (desc == null) {
        value = data;

        
          if (watching && define_property.hasPropertyAccessors) {
            meta.values[keyName] = data;
            define_property.defineProperty(obj, keyName, {
              configurable: true,
              enumerable: true,
              set: MANDATORY_SETTER_FUNCTION(keyName),
              get: DEFAULT_GETTER_FUNCTION(keyName)
            });
          } else {
            obj[keyName] = data;
          }
              } else {
        value = desc;

        // compatibility with ES5
        define_property.defineProperty(obj, keyName, desc);
      }
    }

    // if key is being watched, override chains that
    // were initialized with the prototype
    if (watching) {
      property_events.overrideChains(obj, keyName, meta);
    }

    // The `value` passed to the `didDefineProperty` hook is
    // either the descriptor or data, whichever was passed.
    if (obj.didDefineProperty) {
      obj.didDefineProperty(obj, keyName, value);
    }

    return this;
  }

});
enifed('ember-metal/property_events', ['exports', 'ember-metal/utils', 'ember-metal/events', 'ember-metal/observer_set'], function (exports, utils, ember_metal__events, ObserverSet) {

  'use strict';

  exports.propertyWillChange = propertyWillChange;
  exports.propertyDidChange = propertyDidChange;
  exports.overrideChains = overrideChains;
  exports.beginPropertyChanges = beginPropertyChanges;
  exports.endPropertyChanges = endPropertyChanges;
  exports.changeProperties = changeProperties;

  var PROPERTY_DID_CHANGE = utils.symbol("PROPERTY_DID_CHANGE");

  var beforeObserverSet = new ObserverSet['default']();
  var observerSet = new ObserverSet['default']();
  var deferred = 0;

  // ..........................................................
  // PROPERTY CHANGES
  //

  /**
    This function is called just before an object property is about to change.
    It will notify any before observers and prepare caches among other things.

    Normally you will not need to call this method directly but if for some
    reason you can't directly watch a property you can invoke this method
    manually along with `Ember.propertyDidChange()` which you should call just
    after the property value changes.

    @method propertyWillChange
    @for Ember
    @param {Object} obj The object with the property that will change
    @param {String} keyName The property key (or path) that will change.
    @return {void}
  */
  function propertyWillChange(obj, keyName) {
    var m = obj["__ember_meta__"];
    var watching = m && m.watching[keyName] > 0 || keyName === "length";
    var proto = m && m.proto;
    var possibleDesc = obj[keyName];
    var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;

    if (!watching) {
      return;
    }

    if (proto === obj) {
      return;
    }

    if (desc && desc.willChange) {
      desc.willChange(obj, keyName);
    }

    dependentKeysWillChange(obj, keyName, m);
    chainsWillChange(obj, keyName, m);
    notifyBeforeObservers(obj, keyName);
  }

  /**
    This function is called just after an object property has changed.
    It will notify any observers and clear caches among other things.

    Normally you will not need to call this method directly but if for some
    reason you can't directly watch a property you can invoke this method
    manually along with `Ember.propertyWillChange()` which you should call just
    before the property value changes.

    @method propertyDidChange
    @for Ember
    @param {Object} obj The object with the property that will change
    @param {String} keyName The property key (or path) that will change.
    @return {void}
  */
  function propertyDidChange(obj, keyName) {
    var m = obj["__ember_meta__"];
    var watching = m && m.watching[keyName] > 0 || keyName === "length";
    var proto = m && m.proto;
    var possibleDesc = obj[keyName];
    var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;

    if (proto === obj) {
      return;
    }

    // shouldn't this mean that we're watching this key?
    if (desc && desc.didChange) {
      desc.didChange(obj, keyName);
    }

    if (obj[PROPERTY_DID_CHANGE]) {
      obj[PROPERTY_DID_CHANGE](keyName);
    }

    if (!watching && keyName !== "length") {
      return;
    }

    if (m && m.deps && m.deps[keyName]) {
      dependentKeysDidChange(obj, keyName, m);
    }

    chainsDidChange(obj, keyName, m, false);
    notifyObservers(obj, keyName);
  }

  var WILL_SEEN, DID_SEEN;
  // called whenever a property is about to change to clear the cache of any dependent keys (and notify those properties of changes, etc...)
  function dependentKeysWillChange(obj, depKey, meta) {
    if (obj.isDestroying) {
      return;
    }

    var deps;
    if (meta && meta.deps && (deps = meta.deps[depKey])) {
      var seen = WILL_SEEN;
      var top = !seen;

      if (top) {
        seen = WILL_SEEN = {};
      }

      iterDeps(propertyWillChange, obj, deps, depKey, seen, meta);

      if (top) {
        WILL_SEEN = null;
      }
    }
  }

  // called whenever a property has just changed to update dependent keys
  function dependentKeysDidChange(obj, depKey, meta) {
    if (obj.isDestroying) {
      return;
    }

    var deps;
    if (meta && meta.deps && (deps = meta.deps[depKey])) {
      var seen = DID_SEEN;
      var top = !seen;

      if (top) {
        seen = DID_SEEN = {};
      }

      iterDeps(propertyDidChange, obj, deps, depKey, seen, meta);

      if (top) {
        DID_SEEN = null;
      }
    }
  }

  function keysOf(obj) {
    var keys = [];

    for (var key in obj) {
      keys.push(key);
    }

    return keys;
  }

  function iterDeps(method, obj, deps, depKey, seen, meta) {
    var keys, key, i, possibleDesc, desc;
    var guid = utils.guidFor(obj);
    var current = seen[guid];

    if (!current) {
      current = seen[guid] = {};
    }

    if (current[depKey]) {
      return;
    }

    current[depKey] = true;

    if (deps) {
      keys = keysOf(deps);
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        possibleDesc = obj[key];
        desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;

        if (desc && desc._suspended === obj) {
          continue;
        }

        method(obj, key);
      }
    }
  }

  function chainsWillChange(obj, keyName, m) {
    if (!(m.hasOwnProperty("chainWatchers") && m.chainWatchers[keyName])) {
      return;
    }

    var nodes = m.chainWatchers[keyName];
    var events = [];
    var i, l;

    for (i = 0, l = nodes.length; i < l; i++) {
      nodes[i].willChange(events);
    }

    for (i = 0, l = events.length; i < l; i += 2) {
      propertyWillChange(events[i], events[i + 1]);
    }
  }

  function chainsDidChange(obj, keyName, m, suppressEvents) {
    if (!(m && m.hasOwnProperty("chainWatchers") && m.chainWatchers[keyName])) {
      return;
    }

    var nodes = m.chainWatchers[keyName];
    var events = suppressEvents ? null : [];
    var i, l;

    for (i = 0, l = nodes.length; i < l; i++) {
      nodes[i].didChange(events);
    }

    if (suppressEvents) {
      return;
    }

    for (i = 0, l = events.length; i < l; i += 2) {
      propertyDidChange(events[i], events[i + 1]);
    }
  }

  function overrideChains(obj, keyName, m) {
    chainsDidChange(obj, keyName, m, true);
  }

  /**
    @method beginPropertyChanges
    @chainable
    @private
  */
  function beginPropertyChanges() {
    deferred++;
  }

  /**
    @method endPropertyChanges
    @private
  */
  function endPropertyChanges() {
    deferred--;
    if (deferred <= 0) {
      beforeObserverSet.clear();
      observerSet.flush();
    }
  }

  /**
    Make a series of property changes together in an
    exception-safe way.

    ```javascript
    Ember.changeProperties(function() {
      obj1.set('foo', mayBlowUpWhenSet);
      obj2.set('bar', baz);
    });
    ```

    @method changeProperties
    @param {Function} callback
    @param [binding]
  */
  function changeProperties(callback, binding) {
    beginPropertyChanges();
    utils.tryFinally(callback, endPropertyChanges, binding);
  }

  function notifyBeforeObservers(obj, keyName) {
    if (obj.isDestroying) {
      return;
    }

    var eventName = keyName + ":before";
    var listeners, added;
    if (deferred) {
      listeners = beforeObserverSet.add(obj, keyName, eventName);
      added = ember_metal__events.accumulateListeners(obj, eventName, listeners);
      ember_metal__events.sendEvent(obj, eventName, [obj, keyName], added);
    } else {
      ember_metal__events.sendEvent(obj, eventName, [obj, keyName]);
    }
  }

  function notifyObservers(obj, keyName) {
    if (obj.isDestroying) {
      return;
    }

    var eventName = keyName + ":change";
    var listeners;
    if (deferred) {
      listeners = observerSet.add(obj, keyName, eventName);
      ember_metal__events.accumulateListeners(obj, eventName, listeners);
    } else {
      ember_metal__events.sendEvent(obj, eventName, [obj, keyName]);
    }
  }

  exports.PROPERTY_DID_CHANGE = PROPERTY_DID_CHANGE;

});
enifed('ember-metal/property_get', ['exports', 'ember-metal/core', 'ember-metal/error', 'ember-metal/path_cache', 'ember-metal/platform/define_property', 'ember-metal/utils'], function (exports, Ember, EmberError, path_cache, define_property, utils) {

  'use strict';

  exports.get = get;
  exports.normalizeTuple = normalizeTuple;
  exports._getPath = _getPath;
  exports.getWithDefault = getWithDefault;

  // ..........................................................
  // GET AND SET
  //
  // If we are on a platform that supports accessors we can use those.
  // Otherwise simulate accessors by looking up the property directly on the
  // object.

  /**
    Gets the value of a property on an object. If the property is computed,
    the function will be invoked. If the property is not defined but the
    object implements the `unknownProperty` method then that will be invoked.

    If you plan to run on IE8 and older browsers then you should use this
    method anytime you want to retrieve a property on an object that you don't
    know for sure is private. (Properties beginning with an underscore '_'
    are considered private.)

    On all newer browsers, you only need to use this method to retrieve
    properties if the property might not be defined on the object and you want
    to respect the `unknownProperty` handler. Otherwise you can ignore this
    method.

    Note that if the object itself is `undefined`, this method will throw
    an error.

    @method get
    @for Ember
    @param {Object} obj The object to retrieve from.
    @param {String} keyName The property key to retrieve
    @return {Object} the property value or `null`.
  */
  var FIRST_KEY = /^([^\.]+)/;

  var INTERCEPT_GET = utils.symbol("INTERCEPT_GET");
  var UNHANDLED_GET = utils.symbol("UNHANDLED_GET");function get(obj, keyName) {
    // Helpers that operate with 'this' within an #each
    if (keyName === "") {
      return obj;
    }

    if (!keyName && "string" === typeof obj) {
      keyName = obj;
      obj = Ember['default'].lookup;
    }

    Ember['default'].assert("Cannot call get with " + keyName + " key.", !!keyName);
    Ember['default'].assert("Cannot call get with '" + keyName + "' on an undefined object.", obj !== undefined);

    if (!obj) {
      return _getPath(obj, keyName);
    }

    if (obj && typeof obj[INTERCEPT_GET] === "function") {
      var result = obj[INTERCEPT_GET](obj, keyName);
      if (result !== UNHANDLED_GET) {
        return result;
      }
    }

    var meta = obj["__ember_meta__"];
    var possibleDesc = obj[keyName];
    var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;
    var ret;

    if (desc === undefined && path_cache.isPath(keyName)) {
      return _getPath(obj, keyName);
    }

    if (desc) {
      return desc.get(obj, keyName);
    } else {
      
        if (define_property.hasPropertyAccessors && meta && meta.watching[keyName] > 0) {
          ret = meta.values[keyName];
        } else {
          ret = obj[keyName];
        }
      
      if (ret === undefined && "object" === typeof obj && !(keyName in obj) && "function" === typeof obj.unknownProperty) {
        return obj.unknownProperty(keyName);
      }

      return ret;
    }
  }

  function normalizeTuple(target, path) {
    var hasThis = path_cache.hasThis(path);
    var isGlobal = !hasThis && path_cache.isGlobal(path);
    var key;

    if (!target && !isGlobal) {
      return [undefined, ""];
    }

    if (hasThis) {
      path = path.slice(5);
    }

    if (!target || isGlobal) {
      target = Ember['default'].lookup;
    }

    if (isGlobal && path_cache.isPath(path)) {
      key = path.match(FIRST_KEY)[0];
      target = get(target, key);
      path = path.slice(key.length + 1);
    }

    // must return some kind of path to be valid else other things will break.
    validateIsPath(path);

    return [target, path];
  }

  function validateIsPath(path) {
    if (!path || path.length === 0) {
      throw new EmberError['default']("Object in path " + path + " could not be found or was destroyed.");
    }
  }
  function _getPath(root, path) {
    var hasThis, parts, tuple, idx, len;

    // detect complicated paths and normalize them
    hasThis = path_cache.hasThis(path);

    if (!root || hasThis) {
      tuple = normalizeTuple(root, path);
      root = tuple[0];
      path = tuple[1];
      tuple.length = 0;
    }

    parts = path.split(".");
    len = parts.length;
    for (idx = 0; root != null && idx < len; idx++) {
      root = get(root, parts[idx], true);
      if (root && root.isDestroyed) {
        return undefined;
      }
    }
    return root;
  }

  function getWithDefault(root, key, defaultValue) {
    var value = get(root, key);

    if (value === undefined) {
      return defaultValue;
    }
    return value;
  }

  exports['default'] = get;

  exports.INTERCEPT_GET = INTERCEPT_GET;
  exports.UNHANDLED_GET = UNHANDLED_GET;

});
enifed('ember-metal/property_set', ['exports', 'ember-metal/core', 'ember-metal/property_get', 'ember-metal/property_events', 'ember-metal/properties', 'ember-metal/error', 'ember-metal/path_cache', 'ember-metal/platform/define_property', 'ember-metal/utils'], function (exports, Ember, property_get, property_events, properties, EmberError, path_cache, define_property, utils) {

  'use strict';

  exports.set = set;
  exports.trySet = trySet;

  /**
    Sets the value of a property on an object, respecting computed properties
    and notifying observers and other listeners of the change. If the
    property is not defined but the object implements the `setUnknownProperty`
    method then that will be invoked as well.

    @method set
    @for Ember
    @param {Object} obj The object to modify.
    @param {String} keyName The property key to set
    @param {Object} value The value to set
    @return {Object} the passed value.
  */
  var INTERCEPT_SET = utils.symbol("INTERCEPT_SET");
  var UNHANDLED_SET = utils.symbol("UNHANDLED_SET");function set(obj, keyName, value, tolerant) {
    if (typeof obj === "string") {
      Ember['default'].assert("Path '" + obj + "' must be global if no obj is given.", path_cache.isGlobalPath(obj));
      value = keyName;
      keyName = obj;
      obj = Ember['default'].lookup;
    }

    Ember['default'].assert("Cannot call set with '" + keyName + "' key.", !!keyName);

    if (obj === Ember['default'].lookup) {
      return setPath(obj, keyName, value, tolerant);
    }

    // This path exists purely to implement backwards-compatible
    // effects (specifically, setting a property on a view may
    // invoke a mutator on `attrs`).
    if (obj && typeof obj[INTERCEPT_SET] === "function") {
      var result = obj[INTERCEPT_SET](obj, keyName, value, tolerant);
      if (result !== UNHANDLED_SET) {
        return result;
      }
    }

    var meta, possibleDesc, desc;
    if (obj) {
      meta = obj["__ember_meta__"];
      possibleDesc = obj[keyName];
      desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;
    }

    var isUnknown, currentValue;
    if ((!obj || desc === undefined) && path_cache.isPath(keyName)) {
      return setPath(obj, keyName, value, tolerant);
    }

    Ember['default'].assert("You need to provide an object and key to `set`.", !!obj && keyName !== undefined);
    Ember['default'].assert("calling set on destroyed object", !obj.isDestroyed);

    if (desc) {
      desc.set(obj, keyName, value);
    } else {

      if (obj !== null && value !== undefined && typeof obj === "object" && obj[keyName] === value) {
        return value;
      }

      isUnknown = "object" === typeof obj && !(keyName in obj);

      // setUnknownProperty is called if `obj` is an object,
      // the property does not already exist, and the
      // `setUnknownProperty` method exists on the object
      if (isUnknown && "function" === typeof obj.setUnknownProperty) {
        obj.setUnknownProperty(keyName, value);
      } else if (meta && meta.watching[keyName] > 0) {
        if (meta.proto !== obj) {
          
            if (define_property.hasPropertyAccessors) {
              currentValue = meta.values[keyName];
            } else {
              currentValue = obj[keyName];
            }
                  }
        // only trigger a change if the value has changed
        if (value !== currentValue) {
          property_events.propertyWillChange(obj, keyName);
          
            if (define_property.hasPropertyAccessors) {
              if (currentValue === undefined && !(keyName in obj) || !Object.prototype.propertyIsEnumerable.call(obj, keyName)) {
                properties.defineProperty(obj, keyName, null, value); // setup mandatory setter
              } else {
                meta.values[keyName] = value;
              }
            } else {
              obj[keyName] = value;
            }
                    property_events.propertyDidChange(obj, keyName);
        }
      } else {
        obj[keyName] = value;
        if (obj[property_events.PROPERTY_DID_CHANGE]) {
          obj[property_events.PROPERTY_DID_CHANGE](keyName);
        }
      }
    }
    return value;
  }

  function setPath(root, path, value, tolerant) {
    var keyName;

    // get the last part of the path
    keyName = path.slice(path.lastIndexOf(".") + 1);

    // get the first part of the part
    path = path === keyName ? keyName : path.slice(0, path.length - (keyName.length + 1));

    // unless the path is this, look up the first part to
    // get the root
    if (path !== "this") {
      root = property_get._getPath(root, path);
    }

    if (!keyName || keyName.length === 0) {
      throw new EmberError['default']("Property set failed: You passed an empty path");
    }

    if (!root) {
      if (tolerant) {
        return;
      } else {
        throw new EmberError['default']("Property set failed: object in path \"" + path + "\" could not be found or was destroyed.");
      }
    }

    return set(root, keyName, value);
  }
  function trySet(root, path, value) {
    return set(root, path, value, true);
  }

  exports.INTERCEPT_SET = INTERCEPT_SET;
  exports.UNHANDLED_SET = UNHANDLED_SET;

});
enifed('ember-metal/run_loop', ['exports', 'ember-metal/core', 'ember-metal/utils', 'ember-metal/array', 'ember-metal/property_events', 'backburner'], function (exports, Ember, utils, array, property_events, Backburner) {

  'use strict';

  function onBegin(current) {
    run.currentRunLoop = current;
  }

  function onEnd(current, next) {
    run.currentRunLoop = next;
  }

  // ES6TODO: should Backburner become es6?
  var backburner = new Backburner['default'](['sync', 'actions', 'destroy'], {
    GUID_KEY: utils.GUID_KEY,
    sync: {
      before: property_events.beginPropertyChanges,
      after: property_events.endPropertyChanges
    },
    defaultQueue: 'actions',
    onBegin: onBegin,
    onEnd: onEnd,
    onErrorTarget: Ember['default'],
    onErrorMethod: 'onerror'
  });

  // ..........................................................
  // run - this is ideally the only public API the dev sees
  //

  /**
    Runs the passed target and method inside of a RunLoop, ensuring any
    deferred actions including bindings and views updates are flushed at the
    end.

    Normally you should not need to invoke this method yourself. However if
    you are implementing raw event handlers when interfacing with other
    libraries or plugins, you should probably wrap all of your code inside this
    call.

    ```javascript
    run(function() {
      // code to be executed within a RunLoop
    });
    ```

    @class run
    @namespace Ember
    @static
    @constructor
    @param {Object} [target] target of method to call
    @param {Function|String} method Method to invoke.
      May be a function or a string. If you pass a string
      then it will be looked up on the passed target.
    @param {Object} [args*] Any additional arguments you wish to pass to the method.
    @return {Object} return value from invoking the passed function.
  */
  exports['default'] = run;
  function run() {
    return backburner.run.apply(backburner, arguments);
  }

  /**
    If no run-loop is present, it creates a new one. If a run loop is
    present it will queue itself to run on the existing run-loops action
    queue.

    Please note: This is not for normal usage, and should be used sparingly.

    If invoked when not within a run loop:

    ```javascript
    run.join(function() {
      // creates a new run-loop
    });
    ```

    Alternatively, if called within an existing run loop:

    ```javascript
    run(function() {
      // creates a new run-loop
      run.join(function() {
        // joins with the existing run-loop, and queues for invocation on
        // the existing run-loops action queue.
      });
    });
    ```

    @method join
    @namespace Ember
    @param {Object} [target] target of method to call
    @param {Function|String} method Method to invoke.
      May be a function or a string. If you pass a string
      then it will be looked up on the passed target.
    @param {Object} [args*] Any additional arguments you wish to pass to the method.
    @return {Object} Return value from invoking the passed function. Please note,
    when called within an existing loop, no return value is possible.
  */
  run.join = function () {
    return backburner.join.apply(backburner, arguments);
  };

  /**
    Allows you to specify which context to call the specified function in while
    adding the execution of that function to the Ember run loop. This ability
    makes this method a great way to asynchronously integrate third-party libraries
    into your Ember application.

    `run.bind` takes two main arguments, the desired context and the function to
    invoke in that context. Any additional arguments will be supplied as arguments
    to the function that is passed in.

    Let's use the creation of a TinyMCE component as an example. Currently,
    TinyMCE provides a setup configuration option we can use to do some processing
    after the TinyMCE instance is initialized but before it is actually rendered.
    We can use that setup option to do some additional setup for our component.
    The component itself could look something like the following:

    ```javascript
    App.RichTextEditorComponent = Ember.Component.extend({
      initializeTinyMCE: Ember.on('didInsertElement', function() {
        tinymce.init({
          selector: '#' + this.$().prop('id'),
          setup: Ember.run.bind(this, this.setupEditor)
        });
      }),

      setupEditor: function(editor) {
        this.set('editor', editor);

        editor.on('change', function() {
          console.log('content changed!');
        });
      }
    });
    ```

    In this example, we use Ember.run.bind to bind the setupEditor method to the
    context of the App.RichTextEditorComponent and to have the invocation of that
    method be safely handled and executed by the Ember run loop.

    @method bind
    @namespace Ember
    @param {Object} [target] target of method to call
    @param {Function|String} method Method to invoke.
      May be a function or a string. If you pass a string
      then it will be looked up on the passed target.
    @param {Object} [args*] Any additional arguments you wish to pass to the method.
    @return {Function} returns a new function that will always have a particular context
    @since 1.4.0
  */
  run.bind = function () {
    for (var _len = arguments.length, curried = Array(_len), _key = 0; _key < _len; _key++) {
      curried[_key] = arguments[_key];
    }

    return function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return run.join.apply(run, curried.concat(args));
    };
  };

  run.backburner = backburner;
  run.currentRunLoop = null;
  run.queues = backburner.queueNames;

  /**
    Begins a new RunLoop. Any deferred actions invoked after the begin will
    be buffered until you invoke a matching call to `run.end()`. This is
    a lower-level way to use a RunLoop instead of using `run()`.

    ```javascript
    run.begin();
    // code to be executed within a RunLoop
    run.end();
    ```

    @method begin
    @return {void}
  */
  run.begin = function () {
    backburner.begin();
  };

  /**
    Ends a RunLoop. This must be called sometime after you call
    `run.begin()` to flush any deferred actions. This is a lower-level way
    to use a RunLoop instead of using `run()`.

    ```javascript
    run.begin();
    // code to be executed within a RunLoop
    run.end();
    ```

    @method end
    @return {void}
  */
  run.end = function () {
    backburner.end();
  };

  /**
    Array of named queues. This array determines the order in which queues
    are flushed at the end of the RunLoop. You can define your own queues by
    simply adding the queue name to this array. Normally you should not need
    to inspect or modify this property.

    @property queues
    @type Array
    @default ['sync', 'actions', 'destroy']
  */

  /**
    Adds the passed target/method and any optional arguments to the named
    queue to be executed at the end of the RunLoop. If you have not already
    started a RunLoop when calling this method one will be started for you
    automatically.

    At the end of a RunLoop, any methods scheduled in this way will be invoked.
    Methods will be invoked in an order matching the named queues defined in
    the `run.queues` property.

    ```javascript
    run.schedule('sync', this, function() {
      // this will be executed in the first RunLoop queue, when bindings are synced
      console.log('scheduled on sync queue');
    });

    run.schedule('actions', this, function() {
      // this will be executed in the 'actions' queue, after bindings have synced.
      console.log('scheduled on actions queue');
    });

    // Note the functions will be run in order based on the run queues order.
    // Output would be:
    //   scheduled on sync queue
    //   scheduled on actions queue
    ```

    @method schedule
    @param {String} queue The name of the queue to schedule against.
      Default queues are 'sync' and 'actions'
    @param {Object} [target] target object to use as the context when invoking a method.
    @param {String|Function} method The method to invoke. If you pass a string it
      will be resolved on the target object at the time the scheduled item is
      invoked allowing you to change the target function.
    @param {Object} [arguments*] Optional arguments to be passed to the queued method.
    @return {void}
  */
  run.schedule = function () {
    checkAutoRun();
    backburner.schedule.apply(backburner, arguments);
  };

  // Used by global test teardown
  run.hasScheduledTimers = function () {
    return backburner.hasTimers();
  };

  // Used by global test teardown
  run.cancelTimers = function () {
    backburner.cancelTimers();
  };

  /**
    Immediately flushes any events scheduled in the 'sync' queue. Bindings
    use this queue so this method is a useful way to immediately force all
    bindings in the application to sync.

    You should call this method anytime you need any changed state to propagate
    throughout the app immediately without repainting the UI (which happens
    in the later 'render' queue added by the `ember-views` package).

    ```javascript
    run.sync();
    ```

    @method sync
    @return {void}
  */
  run.sync = function () {
    if (backburner.currentInstance) {
      backburner.currentInstance.queues.sync.flush();
    }
  };

  /**
    Invokes the passed target/method and optional arguments after a specified
    period of time. The last parameter of this method must always be a number
    of milliseconds.

    You should use this method whenever you need to run some action after a
    period of time instead of using `setTimeout()`. This method will ensure that
    items that expire during the same script execution cycle all execute
    together, which is often more efficient than using a real setTimeout.

    ```javascript
    run.later(myContext, function() {
      // code here will execute within a RunLoop in about 500ms with this == myContext
    }, 500);
    ```

    @method later
    @param {Object} [target] target of method to invoke
    @param {Function|String} method The method to invoke.
      If you pass a string it will be resolved on the
      target at the time the method is invoked.
    @param {Object} [args*] Optional arguments to pass to the timeout.
    @param {Number} wait Number of milliseconds to wait.
    @return {*} Timer information for use in cancelling, see `run.cancel`.
  */
  run.later = function () {
    return backburner.later.apply(backburner, arguments);
  };

  /**
    Schedule a function to run one time during the current RunLoop. This is equivalent
    to calling `scheduleOnce` with the "actions" queue.

    @method once
    @param {Object} [target] The target of the method to invoke.
    @param {Function|String} method The method to invoke.
      If you pass a string it will be resolved on the
      target at the time the method is invoked.
    @param {Object} [args*] Optional arguments to pass to the timeout.
    @return {Object} Timer information for use in cancelling, see `run.cancel`.
  */
  run.once = function () {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    checkAutoRun();
    args.unshift('actions');
    return backburner.scheduleOnce.apply(backburner, args);
  };

  /**
    Schedules a function to run one time in a given queue of the current RunLoop.
    Calling this method with the same queue/target/method combination will have
    no effect (past the initial call).

    Note that although you can pass optional arguments these will not be
    considered when looking for duplicates. New arguments will replace previous
    calls.

    ```javascript
    function sayHi() {
      console.log('hi');
    }

    run(function() {
      run.scheduleOnce('afterRender', myContext, sayHi);
      run.scheduleOnce('afterRender', myContext, sayHi);
      // sayHi will only be executed once, in the afterRender queue of the RunLoop
    });
    ```

    Also note that passing an anonymous function to `run.scheduleOnce` will
    not prevent additional calls with an identical anonymous function from
    scheduling the items multiple times, e.g.:

    ```javascript
    function scheduleIt() {
      run.scheduleOnce('actions', myContext, function() {
        console.log('Closure');
      });
    }

    scheduleIt();
    scheduleIt();

    // "Closure" will print twice, even though we're using `run.scheduleOnce`,
    // because the function we pass to it is anonymous and won't match the
    // previously scheduled operation.
    ```

    Available queues, and their order, can be found at `run.queues`

    @method scheduleOnce
    @param {String} [queue] The name of the queue to schedule against. Default queues are 'sync' and 'actions'.
    @param {Object} [target] The target of the method to invoke.
    @param {Function|String} method The method to invoke.
      If you pass a string it will be resolved on the
      target at the time the method is invoked.
    @param {Object} [args*] Optional arguments to pass to the timeout.
    @return {Object} Timer information for use in cancelling, see `run.cancel`.
  */
  run.scheduleOnce = function () {
    checkAutoRun();
    return backburner.scheduleOnce.apply(backburner, arguments);
  };

  /**
    Schedules an item to run from within a separate run loop, after
    control has been returned to the system. This is equivalent to calling
    `run.later` with a wait time of 1ms.

    ```javascript
    run.next(myContext, function() {
      // code to be executed in the next run loop,
      // which will be scheduled after the current one
    });
    ```

    Multiple operations scheduled with `run.next` will coalesce
    into the same later run loop, along with any other operations
    scheduled by `run.later` that expire right around the same
    time that `run.next` operations will fire.

    Note that there are often alternatives to using `run.next`.
    For instance, if you'd like to schedule an operation to happen
    after all DOM element operations have completed within the current
    run loop, you can make use of the `afterRender` run loop queue (added
    by the `ember-views` package, along with the preceding `render` queue
    where all the DOM element operations happen). Example:

    ```javascript
    App.MyCollectionView = Ember.CollectionView.extend({
      didInsertElement: function() {
        run.scheduleOnce('afterRender', this, 'processChildElements');
      },
      processChildElements: function() {
        // ... do something with collectionView's child view
        // elements after they've finished rendering, which
        // can't be done within the CollectionView's
        // `didInsertElement` hook because that gets run
        // before the child elements have been added to the DOM.
      }
    });
    ```

    One benefit of the above approach compared to using `run.next` is
    that you will be able to perform DOM/CSS operations before unprocessed
    elements are rendered to the screen, which may prevent flickering or
    other artifacts caused by delaying processing until after rendering.

    The other major benefit to the above approach is that `run.next`
    introduces an element of non-determinism, which can make things much
    harder to test, due to its reliance on `setTimeout`; it's much harder
    to guarantee the order of scheduled operations when they are scheduled
    outside of the current run loop, i.e. with `run.next`.

    @method next
    @param {Object} [target] target of method to invoke
    @param {Function|String} method The method to invoke.
      If you pass a string it will be resolved on the
      target at the time the method is invoked.
    @param {Object} [args*] Optional arguments to pass to the timeout.
    @return {Object} Timer information for use in cancelling, see `run.cancel`.
  */
  run.next = function () {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    args.push(1);
    return backburner.later.apply(backburner, args);
  };

  /**
    Cancels a scheduled item. Must be a value returned by `run.later()`,
    `run.once()`, `run.next()`, `run.debounce()`, or
    `run.throttle()`.

    ```javascript
    var runNext = run.next(myContext, function() {
      // will not be executed
    });

    run.cancel(runNext);

    var runLater = run.later(myContext, function() {
      // will not be executed
    }, 500);

    run.cancel(runLater);

    var runOnce = run.once(myContext, function() {
      // will not be executed
    });

    run.cancel(runOnce);

    var throttle = run.throttle(myContext, function() {
      // will not be executed
    }, 1, false);

    run.cancel(throttle);

    var debounce = run.debounce(myContext, function() {
      // will not be executed
    }, 1);

    run.cancel(debounce);

    var debounceImmediate = run.debounce(myContext, function() {
      // will be executed since we passed in true (immediate)
    }, 100, true);

    // the 100ms delay until this method can be called again will be cancelled
    run.cancel(debounceImmediate);
    ```

    @method cancel
    @param {Object} timer Timer object to cancel
    @return {Boolean} true if cancelled or false/undefined if it wasn't found
  */
  run.cancel = function (timer) {
    return backburner.cancel(timer);
  };

  /**
    Delay calling the target method until the debounce period has elapsed
    with no additional debounce calls. If `debounce` is called again before
    the specified time has elapsed, the timer is reset and the entire period
    must pass again before the target method is called.

    This method should be used when an event may be called multiple times
    but the action should only be called once when the event is done firing.
    A common example is for scroll events where you only want updates to
    happen once scrolling has ceased.

    ```javascript
    function whoRan() {
      console.log(this.name + ' ran.');
    }

    var myContext = { name: 'debounce' };

    run.debounce(myContext, whoRan, 150);

    // less than 150ms passes
    run.debounce(myContext, whoRan, 150);

    // 150ms passes
    // whoRan is invoked with context myContext
    // console logs 'debounce ran.' one time.
    ```

    Immediate allows you to run the function immediately, but debounce
    other calls for this function until the wait time has elapsed. If
    `debounce` is called again before the specified time has elapsed,
    the timer is reset and the entire period must pass again before
    the method can be called again.

    ```javascript
    function whoRan() {
      console.log(this.name + ' ran.');
    }

    var myContext = { name: 'debounce' };

    run.debounce(myContext, whoRan, 150, true);

    // console logs 'debounce ran.' one time immediately.
    // 100ms passes
    run.debounce(myContext, whoRan, 150, true);

    // 150ms passes and nothing else is logged to the console and
    // the debouncee is no longer being watched
    run.debounce(myContext, whoRan, 150, true);

    // console logs 'debounce ran.' one time immediately.
    // 150ms passes and nothing else is logged to the console and
    // the debouncee is no longer being watched

    ```

    @method debounce
    @param {Object} [target] target of method to invoke
    @param {Function|String} method The method to invoke.
      May be a function or a string. If you pass a string
      then it will be looked up on the passed target.
    @param {Object} [args*] Optional arguments to pass to the timeout.
    @param {Number} wait Number of milliseconds to wait.
    @param {Boolean} immediate Trigger the function on the leading instead
      of the trailing edge of the wait interval. Defaults to false.
    @return {Array} Timer information for use in cancelling, see `run.cancel`.
  */
  run.debounce = function () {
    return backburner.debounce.apply(backburner, arguments);
  };

  /**
    Ensure that the target method is never called more frequently than
    the specified spacing period. The target method is called immediately.

    ```javascript
    function whoRan() {
      console.log(this.name + ' ran.');
    }

    var myContext = { name: 'throttle' };

    run.throttle(myContext, whoRan, 150);
    // whoRan is invoked with context myContext
    // console logs 'throttle ran.'

    // 50ms passes
    run.throttle(myContext, whoRan, 150);

    // 50ms passes
    run.throttle(myContext, whoRan, 150);

    // 150ms passes
    run.throttle(myContext, whoRan, 150);
    // whoRan is invoked with context myContext
    // console logs 'throttle ran.'
    ```

    @method throttle
    @param {Object} [target] target of method to invoke
    @param {Function|String} method The method to invoke.
      May be a function or a string. If you pass a string
      then it will be looked up on the passed target.
    @param {Object} [args*] Optional arguments to pass to the timeout.
    @param {Number} spacing Number of milliseconds to space out requests.
    @param {Boolean} immediate Trigger the function on the leading instead
      of the trailing edge of the wait interval. Defaults to true.
    @return {Array} Timer information for use in cancelling, see `run.cancel`.
  */
  run.throttle = function () {
    return backburner.throttle.apply(backburner, arguments);
  };

  // Make sure it's not an autorun during testing
  function checkAutoRun() {
    if (!run.currentRunLoop) {
      Ember['default'].assert('You have turned on testing mode, which disabled the run-loop\'s autorun.\n                  You will need to wrap any code with asynchronous side-effects in a run', !Ember['default'].testing);
    }
  }

  /**
    Add a new named queue after the specified queue.

    The queue to add will only be added once.

    @method _addQueue
    @param {String} name the name of the queue to add.
    @param {String} after the name of the queue to add after.
    @private
  */
  run._addQueue = function (name, after) {
    if (array.indexOf.call(run.queues, name) === -1) {
      run.queues.splice(array.indexOf.call(run.queues, after) + 1, 0, name);
    }
  };
  /* queue, target, method */ /*target, method*/ /*queue, target, method*/

});
enifed('ember-metal/set_properties', ['exports', 'ember-metal/property_events', 'ember-metal/property_set', 'ember-metal/keys'], function (exports, property_events, property_set, keys) {

  'use strict';



  /**
    Set a list of properties on an object. These properties are set inside
    a single `beginPropertyChanges` and `endPropertyChanges` batch, so
    observers will be buffered.

    ```javascript
    var anObject = Ember.Object.create();

    anObject.setProperties({
      firstName: 'Stanley',
      lastName: 'Stuart',
      age: 21
    });
    ```

    @method setProperties
    @param obj
    @param {Object} properties
    @return obj
  */
  exports['default'] = setProperties;
  function setProperties(obj, properties) {
    if (!properties || typeof properties !== "object") {
      return obj;
    }
    property_events.changeProperties(function () {
      var props = keys['default'](properties);
      var propertyName;

      for (var i = 0, l = props.length; i < l; i++) {
        propertyName = props[i];

        property_set.set(obj, propertyName, properties[propertyName]);
      }
    });
    return obj;
  }

});
enifed('ember-metal/streams/conditional', ['exports', 'ember-metal/streams/stream', 'ember-metal/streams/utils', 'ember-metal/platform/create'], function (exports, Stream, utils, create) {

  'use strict';



  exports['default'] = conditional;

  function conditional(test, consequent, alternate) {
    if (utils.isStream(test)) {
      return new ConditionalStream(test, consequent, alternate);
    } else {
      if (test) {
        return consequent;
      } else {
        return alternate;
      }
    }
  }

  function ConditionalStream(test, consequent, alternate) {
    this.init();

    this.oldTestResult = undefined;
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  ConditionalStream.prototype = create['default'](Stream['default'].prototype);

  ConditionalStream.prototype.compute = function () {
    var oldTestResult = this.oldTestResult;
    var newTestResult = !!utils.read(this.test);

    if (newTestResult !== oldTestResult) {
      switch (oldTestResult) {
        case true:
          utils.unsubscribe(this.consequent, this.notify, this);break;
        case false:
          utils.unsubscribe(this.alternate, this.notify, this);break;
        case undefined:
          utils.subscribe(this.test, this.notify, this);
      }

      switch (newTestResult) {
        case true:
          utils.subscribe(this.consequent, this.notify, this);break;
        case false:
          utils.subscribe(this.alternate, this.notify, this);
      }

      this.oldTestResult = newTestResult;
    }

    return newTestResult ? utils.read(this.consequent) : utils.read(this.alternate);
  };

});
enifed('ember-metal/streams/dependency', ['exports', 'ember-metal/core', 'ember-metal/merge', 'ember-metal/streams/utils'], function (exports, Ember, merge, utils) {

  'use strict';

  function Dependency(depender, dependee) {
    Ember['default'].assert("Dependency error: Depender must be a stream", utils.isStream(depender));

    this.next = null;
    this.prev = null;
    this.depender = depender;
    this.dependee = dependee;
    this.unsubscription = null;
  }

  merge['default'](Dependency.prototype, {
    subscribe: function () {
      Ember['default'].assert("Dependency error: Dependency tried to subscribe while already subscribed", !this.unsubscription);

      this.unsubscription = utils.subscribe(this.dependee, this.depender.notify, this.depender);
    },

    unsubscribe: function () {
      if (this.unsubscription) {
        this.unsubscription();
        this.unsubscription = null;
      }
    },

    replace: function (dependee) {
      if (this.dependee !== dependee) {
        this.dependee = dependee;

        if (this.unsubscription) {
          this.unsubscribe();
          this.subscribe();
        }
      }
    },

    getValue: function () {
      return utils.read(this.dependee);
    },

    setValue: function (value) {
      return utils.setValue(this.dependee, value);
    }

    // destroy() {
    //   var next = this.next;
    //   var prev = this.prev;

    //   if (prev) {
    //     prev.next = next;
    //   } else {
    //     this.depender.dependencyHead = next;
    //   }

    //   if (next) {
    //     next.prev = prev;
    //   } else {
    //     this.depender.dependencyTail = prev;
    //   }

    //   this.unsubscribe();
    // }
  });

  exports['default'] = Dependency;

});
enifed('ember-metal/streams/key-stream', ['exports', 'ember-metal/core', 'ember-metal/merge', 'ember-metal/platform/create', 'ember-metal/property_get', 'ember-metal/property_set', 'ember-metal/observer', 'ember-metal/streams/stream', 'ember-metal/streams/utils'], function (exports, Ember, merge, create, property_get, property_set, observer, Stream, utils) {

  'use strict';

  function KeyStream(source, key) {
    Ember['default'].assert('KeyStream error: source must be a stream', utils.isStream(source)); // TODO: This isn't necessary.
    Ember['default'].assert('KeyStream error: key must be a non-empty string', typeof key === 'string' && key.length > 0);
    Ember['default'].assert('KeyStream error: key must not have a \'.\'', key.indexOf('.') === -1);

    // used to get the original path for debugging and legacy purposes
    var label = labelFor(source, key);

    this.init(label);
    this.path = label;
    this.sourceDep = this.addMutableDependency(source);
    this.observedObject = null;
    this.key = key;
  }

  function labelFor(source, key) {
    return source.label ? source.label + '.' + key : key;
  }

  KeyStream.prototype = create['default'](Stream['default'].prototype);

  merge['default'](KeyStream.prototype, {
    compute: function () {
      var object = this.sourceDep.getValue();
      if (object) {
        return property_get.get(object, this.key);
      }
    },

    setValue: function (value) {
      var object = this.sourceDep.getValue();
      if (object) {
        property_set.set(object, this.key, value);
      }
    },

    setSource: function (source) {
      this.sourceDep.replace(source);
      this.notify();
    },

    _super$revalidate: Stream['default'].prototype.revalidate,

    revalidate: function (value) {
      this._super$revalidate(value);

      var object = this.sourceDep.getValue();
      if (object !== this.observedObject) {
        this.deactivate();

        if (object && typeof object === 'object') {
          observer.addObserver(object, this.key, this, this.notify);
          this.observedObject = object;
        }
      }
    },

    _super$deactivate: Stream['default'].prototype.deactivate,

    deactivate: function () {
      this._super$deactivate();

      if (this.observedObject) {
        observer.removeObserver(this.observedObject, this.key, this, this.notify);
        this.observedObject = null;
      }
    }
  });

  exports['default'] = KeyStream;

});
enifed('ember-metal/streams/proxy-stream', ['exports', 'ember-metal/merge', 'ember-metal/streams/stream', 'ember-metal/platform/create'], function (exports, merge, Stream, create) {

  'use strict';

  function ProxyStream(source, label) {
    this.init(label);
    this.sourceDep = this.addMutableDependency(source);
  }

  ProxyStream.prototype = create['default'](Stream['default'].prototype);

  merge['default'](ProxyStream.prototype, {
    compute: function () {
      return this.sourceDep.getValue();
    },

    setValue: function (value) {
      this.sourceDep.setValue(value);
    },

    setSource: function (source) {
      this.sourceDep.replace(source);
      this.notify();
    }
  });

  exports['default'] = ProxyStream;

});
enifed('ember-metal/streams/stream', ['exports', 'ember-metal/core', 'ember-metal/platform/create', 'ember-metal/path_cache', 'ember-metal/observer', 'ember-metal/streams/utils', 'ember-metal/streams/subscriber', 'ember-metal/streams/dependency'], function (exports, Ember, create, path_cache, observer, utils, Subscriber, Dependency) {

  'use strict';

  function Stream(fn, label) {
    this.init(label);
    this.compute = fn;
  }

  var KeyStream;
  var ProxyMixin;

  Stream.prototype = {
    isStream: true,

    init: function (label) {
      this.label = makeLabel(label);
      this.isActive = false;
      this.isDirty = true;
      this.isDestroyed = false;
      this.cache = undefined;
      this.children = undefined;
      this.subscriberHead = null;
      this.subscriberTail = null;
      this.dependencyHead = null;
      this.dependencyTail = null;
      this.observedProxy = null;
    },

    _makeChildStream: function (key) {
      KeyStream = KeyStream || Ember['default'].__loader.require("ember-metal/streams/key-stream")["default"];
      return new KeyStream(this, key);
    },

    removeChild: function (key) {
      delete this.children[key];
    },

    getKey: function (key) {
      if (this.children === undefined) {
        this.children = create['default'](null);
      }

      var keyStream = this.children[key];

      if (keyStream === undefined) {
        keyStream = this._makeChildStream(key);
        this.children[key] = keyStream;
      }

      return keyStream;
    },

    get: function (path) {
      var firstKey = path_cache.getFirstKey(path);
      var tailPath = path_cache.getTailPath(path);

      if (this.children === undefined) {
        this.children = create['default'](null);
      }

      var keyStream = this.children[firstKey];

      if (keyStream === undefined) {
        keyStream = this._makeChildStream(firstKey, path);
        this.children[firstKey] = keyStream;
      }

      if (tailPath === undefined) {
        return keyStream;
      } else {
        return keyStream.get(tailPath);
      }
    },

    value: function () {
      // TODO: Ensure value is never called on a destroyed stream
      // so that we can uncomment this assertion.
      //
      // Ember.assert("Stream error: value was called after the stream was destroyed", !this.isDestroyed);

      // TODO: Remove this block. This will require ensuring we are
      // not treating streams as "volatile" anywhere.
      if (!this.isActive) {
        this.isDirty = true;
      }

      var willRevalidate = false;

      if (!this.isActive && this.subscriberHead) {
        this.activate();
        willRevalidate = true;
      }

      if (this.isDirty) {
        if (this.isActive) {
          willRevalidate = true;
        }

        this.cache = this.compute();
        this.isDirty = false;
      }

      if (willRevalidate) {
        this.revalidate(this.cache);
      }

      return this.cache;
    },

    addMutableDependency: function (object) {
      var dependency = new Dependency['default'](this, object);

      if (this.isActive) {
        dependency.subscribe();
      }

      if (this.dependencyHead === null) {
        this.dependencyHead = this.dependencyTail = dependency;
      } else {
        var tail = this.dependencyTail;
        tail.next = dependency;
        dependency.prev = tail;
        this.dependencyTail = dependency;
      }

      return dependency;
    },

    addDependency: function (object) {
      if (utils.isStream(object)) {
        this.addMutableDependency(object);
      }
    },

    subscribeDependencies: function () {
      var dependency = this.dependencyHead;
      while (dependency) {
        var next = dependency.next;
        dependency.subscribe();
        dependency = next;
      }
    },

    unsubscribeDependencies: function () {
      var dependency = this.dependencyHead;
      while (dependency) {
        var next = dependency.next;
        dependency.unsubscribe();
        dependency = next;
      }
    },

    maybeDeactivate: function () {
      if (!this.subscriberHead && this.isActive) {
        this.isActive = false;
        this.unsubscribeDependencies();
        this.deactivate();
      }
    },

    activate: function () {
      this.isActive = true;
      this.subscribeDependencies();
    },

    revalidate: function (value) {
      if (value !== this.observedProxy) {
        this.deactivate();

        ProxyMixin = ProxyMixin || Ember['default'].__loader.require("ember-runtime/mixins/-proxy")["default"];

        if (ProxyMixin.detect(value)) {
          observer.addObserver(value, "content", this, this.notify);
          this.observedProxy = value;
        }
      }
    },

    deactivate: function () {
      if (this.observedProxy) {
        observer.removeObserver(this.observedProxy, "content", this, this.notify);
        this.observedProxy = null;
      }
    },

    compute: function () {
      throw new Error("Stream error: compute not implemented");
    },

    setValue: function () {
      throw new Error("Stream error: setValue not implemented");
    },

    notify: function () {
      this.notifyExcept();
    },

    notifyExcept: function (callbackToSkip, contextToSkip) {
      if (!this.isDirty) {
        this.isDirty = true;
        this.notifySubscribers(callbackToSkip, contextToSkip);
      }
    },

    subscribe: function (callback, context) {
      Ember['default'].assert("You tried to subscribe to a stream but the callback provided was not a function.", typeof callback === "function");

      var subscriber = new Subscriber['default'](callback, context, this);
      if (this.subscriberHead === null) {
        this.subscriberHead = this.subscriberTail = subscriber;
      } else {
        var tail = this.subscriberTail;
        tail.next = subscriber;
        subscriber.prev = tail;
        this.subscriberTail = subscriber;
      }

      var stream = this;
      return function (prune) {
        subscriber.removeFrom(stream);
        if (prune) {
          stream.prune();
        }
      };
    },

    prune: function () {
      if (this.subscriberHead === null) {
        this.destroy(true);
      }
    },

    unsubscribe: function (callback, context) {
      var subscriber = this.subscriberHead;

      while (subscriber) {
        var next = subscriber.next;
        if (subscriber.callback === callback && subscriber.context === context) {
          subscriber.removeFrom(this);
        }
        subscriber = next;
      }
    },

    notifySubscribers: function (callbackToSkip, contextToSkip) {
      var subscriber = this.subscriberHead;

      while (subscriber) {
        var next = subscriber.next;

        var callback = subscriber.callback;
        var context = subscriber.context;

        subscriber = next;

        if (callback === callbackToSkip && context === contextToSkip) {
          continue;
        }

        if (context === undefined) {
          callback(this);
        } else {
          callback.call(context, this);
        }
      }
    },

    destroy: function (prune) {
      if (!this.isDestroyed) {
        this.isDestroyed = true;

        this.subscriberHead = this.subscriberTail = null;
        this.maybeDeactivate();

        var dependencies = this.dependencies;

        if (dependencies) {
          for (var i = 0, l = dependencies.length; i < l; i++) {
            dependencies[i](prune);
          }
        }

        this.dependencies = null;
        return true;
      }
    }
  };

  Stream.wrap = function (value, Kind, param) {
    if (utils.isStream(value)) {
      return value;
    } else {
      return new Kind(value, param);
    }
  };

  function makeLabel(label) {
    if (label === undefined) {
      return "(no label)";
    } else {
      return label;
    }
  }

  exports['default'] = Stream;

});
enifed('ember-metal/streams/subscriber', ['exports', 'ember-metal/merge'], function (exports, merge) {

  'use strict';

  function Subscriber(callback, context) {
    this.next = null;
    this.prev = null;
    this.callback = callback;
    this.context = context;
  }

  merge['default'](Subscriber.prototype, {
    removeFrom: function (stream) {
      var next = this.next;
      var prev = this.prev;

      if (prev) {
        prev.next = next;
      } else {
        stream.subscriberHead = next;
      }

      if (next) {
        next.prev = prev;
      } else {
        stream.subscriberTail = prev;
      }

      stream.maybeDeactivate();
    }
  });

  exports['default'] = Subscriber;

});
enifed('ember-metal/streams/utils', ['exports', './stream'], function (exports, Stream) {

  'use strict';

  exports.isStream = isStream;
  exports.subscribe = subscribe;
  exports.unsubscribe = unsubscribe;
  exports.read = read;
  exports.readArray = readArray;
  exports.readHash = readHash;
  exports.scanArray = scanArray;
  exports.scanHash = scanHash;
  exports.concat = concat;
  exports.labelsFor = labelsFor;
  exports.labelsForObject = labelsForObject;
  exports.labelFor = labelFor;
  exports.or = or;
  exports.addDependency = addDependency;
  exports.zip = zip;
  exports.zipHash = zipHash;
  exports.chain = chain;
  exports.setValue = setValue;

  /*
   Check whether an object is a stream or not

   @public
   @for Ember.stream
   @function isStream
   @param {Object|Stream} object object to check whether it is a stream
   @return {Boolean} `true` if the object is a stream, `false` otherwise
  */
  function isStream(object) {
    return object && object.isStream;
  }

  function subscribe(object, callback, context) {
    if (object && object.isStream) {
      return object.subscribe(callback, context);
    }
  }

  function unsubscribe(object, callback, context) {
    if (object && object.isStream) {
      object.unsubscribe(callback, context);
    }
  }

  function read(object) {
    if (object && object.isStream) {
      return object.value();
    } else {
      return object;
    }
  }

  function readArray(array) {
    var length = array.length;
    var ret = new Array(length);
    for (var i = 0; i < length; i++) {
      ret[i] = read(array[i]);
    }
    return ret;
  }

  function readHash(object) {
    var ret = {};
    for (var key in object) {
      ret[key] = read(object[key]);
    }
    return ret;
  }

  function scanArray(array) {
    var length = array.length;
    var containsStream = false;

    for (var i = 0; i < length; i++) {
      if (isStream(array[i])) {
        containsStream = true;
        break;
      }
    }

    return containsStream;
  }

  function scanHash(hash) {
    var containsStream = false;

    for (var prop in hash) {
      if (isStream(hash[prop])) {
        containsStream = true;
        break;
      }
    }

    return containsStream;
  }

  function concat(array, separator) {
    // TODO: Create subclass ConcatStream < Stream. Defer
    // subscribing to streams until the value() is called.
    var hasStream = scanArray(array);
    if (hasStream) {
      var i, l;
      var stream = new Stream['default'](function () {
        return concat(readArray(array), separator);
      }, function () {
        var labels = labelsFor(array);
        return 'concat([' + labels.join(', ') + ']; separator=' + inspect(separator) + ')';
      });

      for (i = 0, l = array.length; i < l; i++) {
        subscribe(array[i], stream.notify, stream);
      }

      // used by angle bracket components to detect an attribute was provided
      // as a string literal
      stream.isConcat = true;
      return stream;
    } else {
      return array.join(separator);
    }
  }

  function labelsFor(streams) {
    var labels = [];

    for (var i = 0, l = streams.length; i < l; i++) {
      var stream = streams[i];
      labels.push(labelFor(stream));
    }

    return labels;
  }

  function labelsForObject(streams) {
    var labels = [];

    for (var prop in streams) {
      labels.push('' + prop + ': ' + inspect(streams[prop]));
    }

    return labels.length ? '{ ' + labels.join(', ') + ' }' : '{}';
  }

  function labelFor(maybeStream) {
    if (isStream(maybeStream)) {
      var stream = maybeStream;
      return typeof stream.label === 'function' ? stream.label() : stream.label;
    } else {
      return inspect(maybeStream);
    }
  }

  function inspect(value) {
    switch (typeof value) {
      case 'string':
        return '"' + value + '"';
      case 'object':
        return '{ ... }';
      case 'function':
        return 'function() { ... }';
      default:
        return String(value);
    }
  }
  function or(first, second) {
    var stream = new Stream['default'](function () {
      return first.value() || second.value();
    }, function () {
      return '' + labelFor(first) + ' || ' + labelFor(second);
    });

    stream.addDependency(first);
    stream.addDependency(second);

    return stream;
  }

  function addDependency(stream, dependency) {
    Ember.assert('Cannot add a stream as a dependency to a non-stream', isStream(stream) || !isStream(dependency));
    if (isStream(stream)) {
      stream.addDependency(dependency);
    }
  }

  function zip(streams, callback, label) {
    Ember.assert('Must call zip with a label', !!label);

    var stream = new Stream['default'](function () {
      var array = readArray(streams);
      return callback ? callback(array) : array;
    }, function () {
      return '' + label + '(' + labelsFor(streams) + ')';
    });

    for (var i = 0, l = streams.length; i < l; i++) {
      stream.addDependency(streams[i]);
    }

    return stream;
  }

  function zipHash(object, callback, label) {
    Ember.assert('Must call zipHash with a label', !!label);

    var stream = new Stream['default'](function () {
      var hash = readHash(object);
      return callback ? callback(hash) : hash;
    }, function () {
      return '' + label + '(' + labelsForObject(object) + ')';
    });

    for (var prop in object) {
      stream.addDependency(object[prop]);
    }

    return stream;
  }

  function chain(value, fn, label) {
    Ember.assert('Must call chain with a label', !!label);
    if (isStream(value)) {
      var stream = new Stream['default'](fn, function () {
        return '' + label + '(' + labelFor(value) + ')';
      });
      stream.addDependency(value);
      return stream;
    } else {
      return fn();
    }
  }

  function setValue(object, value) {
    if (object && object.isStream) {
      object.setValue(value);
    }
  }

});
enifed('ember-metal/symbol', function () {

  'use strict';

});
enifed('ember-metal/utils', ['exports', 'ember-metal/core', 'ember-metal/platform/create', 'ember-metal/platform/define_property'], function (exports, Ember, o_create, define_property) {

  
  exports.uuid = uuid;
  exports.symbol = symbol;
  exports.generateGuid = generateGuid;
  exports.guidFor = guidFor;
  exports.getMeta = getMeta;
  exports.setMeta = setMeta;
  exports.metaPath = metaPath;
  exports.wrap = wrap;
  exports.tryInvoke = tryInvoke;
  exports.makeArray = makeArray;
  exports.inspect = inspect;
  exports.apply = apply;
  exports.applyStr = applyStr;
  exports.meta = meta;
  exports.canInvoke = canInvoke;

  /**
    Generates a universally unique identifier. This method
    is used internally by Ember for assisting with
    the generation of GUID's and other unique identifiers
    such as `bind-attr` data attributes.

    @public
    @return {Number} [description]
   */
  "REMOVE_USE_STRICT: true"; /**
                             @module ember-metal
                             */

  /**
    Previously we used `Ember.$.uuid`, however `$.uuid` has been removed from
    jQuery master. We'll just bootstrap our own uuid now.

    @private
    @return {Number} the uuid
  */
  var _uuid = 0;
  function uuid() {
    return ++_uuid;
  }

  /**
    Prefix used for guids through out Ember.
    @private
    @property GUID_PREFIX
    @for Ember
    @type String
    @final
  */
  var GUID_PREFIX = "ember";

  // Used for guid generation...
  var numberCache = [];
  var stringCache = {};

  /**
    Strongly hint runtimes to intern the provided string.

    When do I need to use this function?

    For the most part, never. Pre-mature optimization is bad, and often the
    runtime does exactly what you need it to, and more often the trade-off isn't
    worth it.

    Why?

    Runtimes store strings in at least 2 different representations:
    Ropes and Symbols (interned strings). The Rope provides a memory efficient
    data-structure for strings created from concatenation or some other string
    manipulation like splitting.

    Unfortunately checking equality of different ropes can be quite costly as
    runtimes must resort to clever string comparison algorithms. These
    algorithms typically cost in proportion to the length of the string.
    Luckily, this is where the Symbols (interned strings) shine. As Symbols are
    unique by their string content, equality checks can be done by pointer
    comparison.

    How do I know if my string is a rope or symbol?

    Typically (warning general sweeping statement, but truthy in runtimes at
    present) static strings created as part of the JS source are interned.
    Strings often used for comparisons can be interned at runtime if some
    criteria are met.  One of these criteria can be the size of the entire rope.
    For example, in chrome 38 a rope longer then 12 characters will not
    intern, nor will segments of that rope.

    Some numbers: http://jsperf.com/eval-vs-keys/8

    Known Trickâ„¢

    @private
    @return {String} interned version of the provided string
  */
  function intern(str) {
    var obj = {};
    obj[str] = 1;
    for (var key in obj) {
      if (key === str) {
        return key;
      }
    }
    return str;
  }
  function symbol(debugName) {
    // TODO: Investigate using platform symbols, but we do not
    // want to require non-enumerability for this API, which
    // would introduce a large cost.

    return intern(debugName + " [id=" + GUID_KEY + Math.floor(Math.random() * new Date()) + "]");
  }

  /**
    A unique key used to assign guids and other private metadata to objects.
    If you inspect an object in your browser debugger you will often see these.
    They can be safely ignored.

    On browsers that support it, these properties are added with enumeration
    disabled so they won't show up when you iterate over your properties.

    @private
    @property GUID_KEY
    @for Ember
    @type String
    @final
  */
  var GUID_KEY = intern("__ember" + +new Date());

  var GUID_DESC = {
    writable: true,
    configurable: true,
    enumerable: false,
    value: null
  };

  var undefinedDescriptor = {
    configurable: true,
    writable: true,
    enumerable: false,
    value: undefined
  };

  var nullDescriptor = {
    configurable: true,
    writable: true,
    enumerable: false,
    value: null
  };

  var META_DESC = {
    writable: true,
    configurable: true,
    enumerable: false,
    value: null
  };

  var EMBER_META_PROPERTY = {
    name: "__ember_meta__",
    descriptor: META_DESC
  };

  var GUID_KEY_PROPERTY = {
    name: GUID_KEY,
    descriptor: nullDescriptor
  };

  var NEXT_SUPER_PROPERTY = {
    name: "__nextSuper",
    descriptor: undefinedDescriptor
  };function generateGuid(obj, prefix) {
    if (!prefix) {
      prefix = GUID_PREFIX;
    }

    var ret = prefix + uuid();
    if (obj) {
      if (obj[GUID_KEY] === null) {
        obj[GUID_KEY] = ret;
      } else {
        GUID_DESC.value = ret;
        if (obj.__defineNonEnumerable) {
          obj.__defineNonEnumerable(GUID_KEY_PROPERTY);
        } else {
          define_property.defineProperty(obj, GUID_KEY, GUID_DESC);
        }
      }
    }
    return ret;
  }

  function guidFor(obj) {

    // special cases where we don't want to add a key to object
    if (obj === undefined) {
      return "(undefined)";
    }

    if (obj === null) {
      return "(null)";
    }

    var ret;
    var type = typeof obj;

    // Don't allow prototype changes to String etc. to change the guidFor
    switch (type) {
      case "number":
        ret = numberCache[obj];

        if (!ret) {
          ret = numberCache[obj] = "nu" + obj;
        }

        return ret;

      case "string":
        ret = stringCache[obj];

        if (!ret) {
          ret = stringCache[obj] = "st" + uuid();
        }

        return ret;

      case "boolean":
        return obj ? "(true)" : "(false)";

      default:
        if (obj[GUID_KEY]) {
          return obj[GUID_KEY];
        }

        if (obj === Object) {
          return "(Object)";
        }

        if (obj === Array) {
          return "(Array)";
        }

        ret = GUID_PREFIX + uuid();

        if (obj[GUID_KEY] === null) {
          obj[GUID_KEY] = ret;
        } else {
          GUID_DESC.value = ret;

          if (obj.__defineNonEnumerable) {
            obj.__defineNonEnumerable(GUID_KEY_PROPERTY);
          } else {
            define_property.defineProperty(obj, GUID_KEY, GUID_DESC);
          }
        }
        return ret;
    }
  }

  // ..........................................................
  // META
  //
  function Meta(obj) {
    this.watching = {};
    this.cache = undefined;
    this.cacheMeta = undefined;
    this.source = obj;
    this.deps = undefined;
    this.listeners = undefined;
    this.mixins = undefined;
    this.bindings = undefined;
    this.chains = undefined;
    this.values = undefined;
    this.proto = undefined;
  }

  Meta.prototype = {
    chainWatchers: null // FIXME
  };

  if (!define_property.canDefineNonEnumerableProperties) {
    // on platforms that don't support enumerable false
    // make meta fail jQuery.isPlainObject() to hide from
    // jQuery.extend() by having a property that fails
    // hasOwnProperty check.
    Meta.prototype.__preventPlainObject__ = true;

    // Without non-enumerable properties, meta objects will be output in JSON
    // unless explicitly suppressed
    Meta.prototype.toJSON = function () {};
  }

  // Placeholder for non-writable metas.
  var EMPTY_META = new Meta(null);

  
    if (define_property.hasPropertyAccessors) {
      EMPTY_META.values = {};
    }
  

  /**
    Retrieves the meta hash for an object. If `writable` is true ensures the
    hash is writable for this object as well.

    The meta object contains information about computed property descriptors as
    well as any watched properties and other information. You generally will
    not access this information directly but instead work with higher level
    methods that manipulate this hash indirectly.

    @method meta
    @for Ember
    @private

    @param {Object} obj The object to retrieve meta for
    @param {Boolean} [writable=true] Pass `false` if you do not intend to modify
      the meta hash, allowing the method to avoid making an unnecessary copy.
    @return {Object} the meta hash for an object
  */
  function meta(obj, writable) {
    var ret = obj.__ember_meta__;
    if (writable === false) {
      return ret || EMPTY_META;
    }

    if (!ret) {
      if (define_property.canDefineNonEnumerableProperties) {
        if (obj.__defineNonEnumerable) {
          obj.__defineNonEnumerable(EMBER_META_PROPERTY);
        } else {
          define_property.defineProperty(obj, "__ember_meta__", META_DESC);
        }
      }

      ret = new Meta(obj);

      
        if (define_property.hasPropertyAccessors) {
          ret.values = {};
        }
      

      obj.__ember_meta__ = ret;
    } else if (ret.source !== obj) {
      if (obj.__defineNonEnumerable) {
        obj.__defineNonEnumerable(EMBER_META_PROPERTY);
      } else {
        define_property.defineProperty(obj, "__ember_meta__", META_DESC);
      }

      ret = o_create['default'](ret);
      ret.watching = o_create['default'](ret.watching);
      ret.cache = undefined;
      ret.cacheMeta = undefined;
      ret.source = obj;

      
        if (define_property.hasPropertyAccessors) {
          ret.values = o_create['default'](ret.values);
        }
      

      obj["__ember_meta__"] = ret;
    }
    return ret;
  }
  function getMeta(obj, property) {
    var _meta = meta(obj, false);
    return _meta[property];
  }

  function setMeta(obj, property, value) {
    var _meta = meta(obj, true);
    _meta[property] = value;
    return value;
  }

  function metaPath(obj, path, writable) {
    Ember['default'].deprecate("Ember.metaPath is deprecated and will be removed from future releases.");
    var _meta = meta(obj, writable);
    var keyName, value;

    for (var i = 0, l = path.length; i < l; i++) {
      keyName = path[i];
      value = _meta[keyName];

      if (!value) {
        if (!writable) {
          return undefined;
        }
        value = _meta[keyName] = { __ember_source__: obj };
      } else if (value.__ember_source__ !== obj) {
        if (!writable) {
          return undefined;
        }
        value = _meta[keyName] = o_create['default'](value);
        value.__ember_source__ = obj;
      }

      _meta = value;
    }

    return value;
  }

  function wrap(func, superFunc) {
    function superWrapper() {
      var ret;
      var sup = this && this.__nextSuper;
      var length = arguments.length;

      if (this) {
        this.__nextSuper = superFunc;
      }

      if (length === 0) {
        ret = func.call(this);
      } else if (length === 1) {
        ret = func.call(this, arguments[0]);
      } else if (length === 2) {
        ret = func.call(this, arguments[0], arguments[1]);
      } else {
        var args = new Array(length);
        for (var i = 0; i < length; i++) {
          args[i] = arguments[i];
        }
        ret = apply(this, func, args);
      }

      if (this) {
        this.__nextSuper = sup;
      }

      return ret;
    }

    superWrapper.wrappedFunction = func;
    superWrapper.__ember_observes__ = func.__ember_observes__;
    superWrapper.__ember_observesBefore__ = func.__ember_observesBefore__;
    superWrapper.__ember_listens__ = func.__ember_listens__;

    return superWrapper;
  }

  /**
    Checks to see if the `methodName` exists on the `obj`.

    ```javascript
    var foo = { bar: function() { return 'bar'; }, baz: null };

    Ember.canInvoke(foo, 'bar'); // true
    Ember.canInvoke(foo, 'baz'); // false
    Ember.canInvoke(foo, 'bat'); // false
    ```

    @method canInvoke
    @for Ember
    @param {Object} obj The object to check for the method
    @param {String} methodName The method name to check for
    @return {Boolean}
  */
  function canInvoke(obj, methodName) {
    return !!(obj && typeof obj[methodName] === "function");
  }
  function tryInvoke(obj, methodName, args) {
    if (canInvoke(obj, methodName)) {
      return args ? applyStr(obj, methodName, args) : applyStr(obj, methodName);
    }
  }

  // https://github.com/emberjs/ember.js/pull/1617
  var needsFinallyFix = (function () {
    var count = 0;
    try {
      // jscs:disable
      try {} finally {
        count++;
        throw new Error("needsFinallyFixTest");
      }
      // jscs:enable
    } catch (e) {}

    return count !== 1;
  })();

  /**
    Provides try/finally functionality, while working
    around Safari's double finally bug.

    ```javascript
    var tryable = function() {
      someResource.lock();
      runCallback(); // May throw error.
    };

    var finalizer = function() {
      someResource.unlock();
    };

    Ember.tryFinally(tryable, finalizer);
    ```

    @method tryFinally
    @deprecated Use JavaScript's native try/finally
    @for Ember
    @param {Function} tryable The function to run the try callback
    @param {Function} finalizer The function to run the finally callback
    @param {Object} [binding] The optional calling object. Defaults to 'this'
    @return {*} The return value is the that of the finalizer,
    unless that value is undefined, in which case it is the return value
    of the tryable
  */

  var tryFinally;
  if (needsFinallyFix) {
    tryFinally = function (tryable, finalizer, binding) {
      var result, finalResult, finalError;

      binding = binding || this;

      try {
        result = tryable.call(binding);
      } finally {
        try {
          finalResult = finalizer.call(binding);
        } catch (e) {
          finalError = e;
        }
      }

      if (finalError) {
        throw finalError;
      }

      return finalResult === undefined ? result : finalResult;
    };
  } else {
    tryFinally = function (tryable, finalizer, binding) {
      var result, finalResult;

      binding = binding || this;

      try {
        result = tryable.call(binding);
      } finally {
        finalResult = finalizer.call(binding);
      }

      return finalResult === undefined ? result : finalResult;
    };
  }

  var deprecatedTryFinally = function () {
    Ember['default'].deprecate("tryFinally is deprecated. Please use JavaScript's native try/finally.", false);
    return tryFinally.apply(this, arguments);
  };

  /**
    Provides try/catch/finally functionality, while working
    around Safari's double finally bug.

    ```javascript
    var tryable = function() {
      for (i = 0, l = listeners.length; i < l; i++) {
        listener = listeners[i];
        beforeValues[i] = listener.before(name, time(), payload);
      }

      return callback.call(binding);
    };

    var catchable = function(e) {
      payload = payload || {};
      payload.exception = e;
    };

    var finalizer = function() {
      for (i = 0, l = listeners.length; i < l; i++) {
        listener = listeners[i];
        listener.after(name, time(), payload, beforeValues[i]);
      }
    };

    Ember.tryCatchFinally(tryable, catchable, finalizer);
    ```

    @method tryCatchFinally
    @deprecated Use JavaScript's native try/catch/finally instead
    @for Ember
    @param {Function} tryable The function to run the try callback
    @param {Function} catchable The function to run the catchable callback
    @param {Function} finalizer The function to run the finally callback
    @param {Object} [binding] The optional calling object. Defaults to 'this'
    @return {*} The return value is the that of the finalizer,
    unless that value is undefined, in which case it is the return value
    of the tryable.
  */
  var tryCatchFinally;
  if (needsFinallyFix) {
    tryCatchFinally = function (tryable, catchable, finalizer, binding) {
      var result, finalResult, finalError;

      binding = binding || this;

      try {
        result = tryable.call(binding);
      } catch (error) {
        result = catchable.call(binding, error);
      } finally {
        try {
          finalResult = finalizer.call(binding);
        } catch (e) {
          finalError = e;
        }
      }

      if (finalError) {
        throw finalError;
      }

      return finalResult === undefined ? result : finalResult;
    };
  } else {
    tryCatchFinally = function (tryable, catchable, finalizer, binding) {
      var result, finalResult;

      binding = binding || this;

      try {
        result = tryable.call(binding);
      } catch (error) {
        result = catchable.call(binding, error);
      } finally {
        finalResult = finalizer.call(binding);
      }

      return finalResult === undefined ? result : finalResult;
    };
  }

  var deprecatedTryCatchFinally = function () {
    Ember['default'].deprecate("tryCatchFinally is deprecated. Please use JavaScript's native try/catch/finally.", false);
    return tryCatchFinally.apply(this, arguments);
  };

  // ........................................
  // TYPING & ARRAY MESSAGING
  //

  var toString = Object.prototype.toString;

  var isArray = Array.isArray || function (value) {
    return value !== null && value !== undefined && typeof value === "object" && typeof value.length === "number" && toString.call(value) === "[object Array]";
  };
  function makeArray(obj) {
    if (obj === null || obj === undefined) {
      return [];
    }
    return isArray(obj) ? obj : [obj];
  }

  function inspect(obj) {
    if (obj === null) {
      return "null";
    }
    if (obj === undefined) {
      return "undefined";
    }
    if (isArray(obj)) {
      return "[" + obj + "]";
    }
    // for non objects
    if (typeof obj !== "object") {
      return "" + obj;
    }
    // overridden toString
    if (typeof obj.toString === "function" && obj.toString !== toString) {
      return obj.toString();
    }

    // Object.prototype.toString === {}.toString
    var v;
    var ret = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        v = obj[key];
        if (v === "toString") {
          continue;
        } // ignore useless items
        if (typeof v === "function") {
          v = "function() { ... }";
        }

        if (v && typeof v.toString !== "function") {
          ret.push(key + ": " + toString.call(v));
        } else {
          ret.push(key + ": " + v);
        }
      }
    }
    return "{" + ret.join(", ") + "}";
  }

  function apply(t, m, a) {
    var l = a && a.length;
    if (!a || !l) {
      return m.call(t);
    }
    switch (l) {
      case 1:
        return m.call(t, a[0]);
      case 2:
        return m.call(t, a[0], a[1]);
      case 3:
        return m.call(t, a[0], a[1], a[2]);
      case 4:
        return m.call(t, a[0], a[1], a[2], a[3]);
      case 5:
        return m.call(t, a[0], a[1], a[2], a[3], a[4]);
      default:
        return m.apply(t, a);
    }
  }

  function applyStr(t, m, a) {
    var l = a && a.length;
    if (!a || !l) {
      return t[m]();
    }
    switch (l) {
      case 1:
        return t[m](a[0]);
      case 2:
        return t[m](a[0], a[1]);
      case 3:
        return t[m](a[0], a[1], a[2]);
      case 4:
        return t[m](a[0], a[1], a[2], a[3]);
      case 5:
        return t[m](a[0], a[1], a[2], a[3], a[4]);
      default:
        return t[m].apply(t, a);
    }
  }

  exports.GUID_DESC = GUID_DESC;
  exports.EMBER_META_PROPERTY = EMBER_META_PROPERTY;
  exports.GUID_KEY_PROPERTY = GUID_KEY_PROPERTY;
  exports.NEXT_SUPER_PROPERTY = NEXT_SUPER_PROPERTY;
  exports.GUID_KEY = GUID_KEY;
  exports.META_DESC = META_DESC;
  exports.EMPTY_META = EMPTY_META;
  exports.isArray = isArray;
  exports.tryCatchFinally = tryCatchFinally;
  exports.deprecatedTryCatchFinally = deprecatedTryCatchFinally;
  exports.tryFinally = tryFinally;
  exports.deprecatedTryFinally = deprecatedTryFinally;

});
enifed('ember-metal/watch_key', ['exports', 'ember-metal/core', 'ember-metal/utils', 'ember-metal/platform/define_property', 'ember-metal/properties'], function (exports, Ember, utils, define_property, properties) {

  'use strict';

  exports.watchKey = watchKey;
  exports.unwatchKey = unwatchKey;

  function watchKey(obj, keyName, meta) {
    // can't watch length on Array - it is special...
    if (keyName === "length" && utils.isArray(obj)) {
      return;
    }

    var m = meta || utils.meta(obj);
    var watching = m.watching;

    // activate watching first time
    if (!watching[keyName]) {
      watching[keyName] = 1;

      var possibleDesc = obj[keyName];
      var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;
      if (desc && desc.willWatch) {
        desc.willWatch(obj, keyName);
      }

      if ("function" === typeof obj.willWatchProperty) {
        obj.willWatchProperty(keyName);
      }

      
        if (define_property.hasPropertyAccessors) {
          handleMandatorySetter(m, obj, keyName);
        }
      
    } else {
      watching[keyName] = (watching[keyName] || 0) + 1;
    }
  }

  
    var handleMandatorySetter = function handleMandatorySetter(m, obj, keyName) {
      var descriptor = Object.getOwnPropertyDescriptor && Object.getOwnPropertyDescriptor(obj, keyName);
      var configurable = descriptor ? descriptor.configurable : true;
      var isWritable = descriptor ? descriptor.writable : true;
      var hasValue = descriptor ? "value" in descriptor : true;
      var possibleDesc = descriptor && descriptor.value;
      var isDescriptor = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor;

      if (isDescriptor) {
        return;
      }

      // this x in Y deopts, so keeping it in this function is better;
      if (configurable && isWritable && hasValue && keyName in obj) {
        m.values[keyName] = obj[keyName];
        define_property.defineProperty(obj, keyName, {
          configurable: true,
          enumerable: Object.prototype.propertyIsEnumerable.call(obj, keyName),
          set: properties.MANDATORY_SETTER_FUNCTION(keyName),
          get: properties.DEFAULT_GETTER_FUNCTION(keyName)
        });
      }
    };
  

  // This is super annoying, but required until
  // https://github.com/babel/babel/issues/906 is resolved
  ;
  function unwatchKey(obj, keyName, meta) {
    var m = meta || utils.meta(obj);
    var watching = m.watching;

    if (watching[keyName] === 1) {
      watching[keyName] = 0;

      var possibleDesc = obj[keyName];
      var desc = possibleDesc !== null && typeof possibleDesc === "object" && possibleDesc.isDescriptor ? possibleDesc : undefined;
      if (desc && desc.didUnwatch) {
        desc.didUnwatch(obj, keyName);
      }

      if ("function" === typeof obj.didUnwatchProperty) {
        obj.didUnwatchProperty(keyName);
      }

      
        if (!desc && define_property.hasPropertyAccessors && keyName in obj) {
          define_property.defineProperty(obj, keyName, {
            configurable: true,
            enumerable: Object.prototype.propertyIsEnumerable.call(obj, keyName),
            set: function (val) {
              // redefine to set as enumerable
              define_property.defineProperty(obj, keyName, {
                configurable: true,
                writable: true,
                enumerable: true,
                value: val
              });
              delete m.values[keyName];
            },
            get: properties.DEFAULT_GETTER_FUNCTION(keyName)
          });
        }
      
    } else if (watching[keyName] > 1) {
      watching[keyName]--;
    }
  }

});
enifed('ember-metal/watch_path', ['exports', 'ember-metal/utils', 'ember-metal/chains'], function (exports, utils, chains) {

  'use strict';

  exports.watchPath = watchPath;
  exports.unwatchPath = unwatchPath;

  function chainsFor(obj, meta) {
    var m = meta || utils.meta(obj);
    var ret = m.chains;
    if (!ret) {
      ret = m.chains = new chains.ChainNode(null, null, obj);
    } else if (ret.value() !== obj) {
      ret = m.chains = ret.copy(obj);
    }
    return ret;
  }
  function watchPath(obj, keyPath, meta) {
    // can't watch length on Array - it is special...
    if (keyPath === "length" && utils.isArray(obj)) {
      return;
    }

    var m = meta || utils.meta(obj);
    var watching = m.watching;

    if (!watching[keyPath]) {
      // activate watching first time
      watching[keyPath] = 1;
      chainsFor(obj, m).add(keyPath);
    } else {
      watching[keyPath] = (watching[keyPath] || 0) + 1;
    }
  }

  function unwatchPath(obj, keyPath, meta) {
    var m = meta || utils.meta(obj);
    var watching = m.watching;

    if (watching[keyPath] === 1) {
      watching[keyPath] = 0;
      chainsFor(obj, m).remove(keyPath);
    } else if (watching[keyPath] > 1) {
      watching[keyPath]--;
    }
  }

});
enifed('ember-metal/watching', ['exports', 'ember-metal/utils', 'ember-metal/chains', 'ember-metal/watch_key', 'ember-metal/watch_path', 'ember-metal/path_cache'], function (exports, utils, chains, watch_key, watch_path, path_cache) {

  'use strict';

  exports.isWatching = isWatching;
  exports.unwatch = unwatch;
  exports.destroy = destroy;
  exports.watch = watch;

  function watch(obj, _keyPath, m) {
    // can't watch length on Array - it is special...
    if (_keyPath === "length" && utils.isArray(obj)) {
      return;
    }

    if (!path_cache.isPath(_keyPath)) {
      watch_key.watchKey(obj, _keyPath, m);
    } else {
      watch_path.watchPath(obj, _keyPath, m);
    }
  }

  function isWatching(obj, key) {
    var meta = obj["__ember_meta__"];
    return (meta && meta.watching[key]) > 0;
  }

  watch.flushPending = chains.flushPendingChains;
  function unwatch(obj, _keyPath, m) {
    // can't watch length on Array - it is special...
    if (_keyPath === "length" && utils.isArray(obj)) {
      return;
    }

    if (!path_cache.isPath(_keyPath)) {
      watch_key.unwatchKey(obj, _keyPath, m);
    } else {
      watch_path.unwatchPath(obj, _keyPath, m);
    }
  }

  var NODE_STACK = [];
  function destroy(obj) {
    var meta = obj["__ember_meta__"];
    var node, nodes, key, nodeObject;

    if (meta) {
      obj["__ember_meta__"] = null;
      // remove chainWatchers to remove circular references that would prevent GC
      node = meta.chains;
      if (node) {
        NODE_STACK.push(node);
        // process tree
        while (NODE_STACK.length > 0) {
          node = NODE_STACK.pop();
          // push children
          nodes = node._chains;
          if (nodes) {
            for (key in nodes) {
              if (nodes.hasOwnProperty(key)) {
                NODE_STACK.push(nodes[key]);
              }
            }
          }
          // remove chainWatcher in node object
          if (node._watching) {
            nodeObject = node._object;
            if (nodeObject) {
              chains.removeChainWatcher(nodeObject, node._key, node);
            }
          }
        }
      }
    }
  }

});
enifed('ember-template-compiler', ['exports', 'ember-metal/core', 'ember-template-compiler/system/precompile', 'ember-template-compiler/system/compile', 'ember-template-compiler/system/template', 'ember-template-compiler/plugins', 'ember-template-compiler/plugins/transform-each-in-to-block-params', 'ember-template-compiler/plugins/transform-with-as-to-hash', 'ember-template-compiler/plugins/transform-bind-attr-to-attributes', 'ember-template-compiler/plugins/transform-each-into-collection', 'ember-template-compiler/plugins/transform-single-arg-each', 'ember-template-compiler/plugins/transform-old-binding-syntax', 'ember-template-compiler/plugins/transform-old-class-binding-syntax', 'ember-template-compiler/plugins/transform-item-class', 'ember-template-compiler/plugins/transform-component-attrs-into-mut', 'ember-template-compiler/plugins/transform-component-curly-to-readonly', 'ember-template-compiler/plugins/transform-angle-bracket-components', 'ember-template-compiler/compat'], function (exports, _Ember, precompile, compile, template, plugins, TransformEachInToBlockParams, TransformWithAsToHash, TransformBindAttrToAttributes, TransformEachIntoCollection, TransformSingleArgEach, TransformOldBindingSyntax, TransformOldClassBindingSyntax, TransformItemClass, TransformComponentAttrsIntoMut, TransformComponentCurlyToReadonly, TransformAngleBracketComponents) {

  'use strict';

  plugins.registerPlugin("ast", TransformWithAsToHash['default']);
  plugins.registerPlugin("ast", TransformEachInToBlockParams['default']);
  plugins.registerPlugin("ast", TransformBindAttrToAttributes['default']);
  plugins.registerPlugin("ast", TransformSingleArgEach['default']);
  plugins.registerPlugin("ast", TransformEachIntoCollection['default']);
  plugins.registerPlugin("ast", TransformOldBindingSyntax['default']);
  plugins.registerPlugin("ast", TransformOldClassBindingSyntax['default']);
  plugins.registerPlugin("ast", TransformItemClass['default']);
  plugins.registerPlugin("ast", TransformComponentAttrsIntoMut['default']);
  plugins.registerPlugin("ast", TransformComponentCurlyToReadonly['default']);
  plugins.registerPlugin("ast", TransformAngleBracketComponents['default']);

  exports._Ember = _Ember['default'];
  exports.precompile = precompile['default'];
  exports.compile = compile['default'];
  exports.template = template['default'];
  exports.registerPlugin = plugins.registerPlugin;

});
enifed('ember-template-compiler/compat', ['ember-metal/core', 'ember-template-compiler/compat/precompile', 'ember-template-compiler/system/compile', 'ember-template-compiler/system/template'], function (Ember, precompile, compile, template) {

  'use strict';

  var EmberHandlebars = Ember['default'].Handlebars = Ember['default'].Handlebars || {};

  EmberHandlebars.precompile = precompile['default'];
  EmberHandlebars.compile = compile['default'];
  EmberHandlebars.template = template['default'];

});
enifed('ember-template-compiler/compat/precompile', ['exports', 'ember-template-compiler/system/compile_options'], function (exports, compileOptions) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */
  var compile, compileSpec;

  exports['default'] = function (string) {
    if ((!compile || !compileSpec) && Ember.__loader.registry['htmlbars-compiler/compiler']) {
      var Compiler = requireModule('htmlbars-compiler/compiler');

      compile = Compiler.compile;
      compileSpec = Compiler.compileSpec;
    }

    if (!compile || !compileSpec) {
      throw new Error('Cannot call `precompile` without the template compiler loaded. Please load `ember-template-compiler.js` prior to calling `precompile`.');
    }

    var asObject = arguments[1] === undefined ? true : arguments[1];
    var compileFunc = asObject ? compile : compileSpec;

    return compileFunc(string, compileOptions['default']());
  }

});
enifed('ember-template-compiler/plugins', ['exports'], function (exports) {

  'use strict';

  exports.registerPlugin = registerPlugin;

  /**
    Adds an AST plugin to be used by Ember.HTMLBars.compile.

    @private
    @method registerASTPlugin
  */
  var plugins = {
    ast: []
  };
  function registerPlugin(type, Plugin) {
    if (!plugins[type]) {
      throw new Error('Attempting to register "' + Plugin + '" as "' + type + '" which is not a valid HTMLBars plugin type.');
    }

    plugins[type].push(Plugin);
  }

  exports['default'] = plugins;

});
enifed('ember-template-compiler/plugins/transform-angle-bracket-components', ['exports'], function (exports) {

  'use strict';

  function TransformAngleBracketComponents() {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformAngleBracketComponents.prototype.transform = function TransformBindAttrToAttributes_transform(ast) {
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      node.tag = '<' + node.tag + '>';
    });

    return ast;
  };

  function validate(node) {
    return node.type === 'ComponentNode';
  }

  exports['default'] = TransformAngleBracketComponents;

});
enifed('ember-template-compiler/plugins/transform-bind-attr-to-attributes', ['exports', 'ember-metal/core', 'ember-template-compiler/system/string'], function (exports, Ember, string) {

  'use strict';

  /**
  @module ember
  @submodule ember-htmlbars
  */

  function TransformBindAttrToAttributes(options) {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
    this.options = options || {};
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformBindAttrToAttributes.prototype.transform = function TransformBindAttrToAttributes_transform(ast) {
    var plugin = this;
    var moduleName = this.options.moduleName;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (node.type === "ElementNode") {
        for (var i = 0; i < node.modifiers.length; i++) {
          var modifier = node.modifiers[i];

          if (isBindAttrModifier(modifier, moduleName)) {
            node.modifiers.splice(i--, 1);
            plugin.assignAttrs(node, modifier.hash);
          }
        }
      }
    });

    return ast;
  };

  TransformBindAttrToAttributes.prototype.assignAttrs = function assignAttrs(element, hash) {
    var pairs = hash.pairs;

    for (var i = 0; i < pairs.length; i++) {
      var name = pairs[i].key;
      var value = pairs[i].value;

      assertAttrNameIsUnused(element, name);

      var attr = this.syntax.builders.attr(name, this.transformValue(name, value));
      element.attributes.push(attr);
    }
  };

  TransformBindAttrToAttributes.prototype.transformValue = function transformValue(name, value) {
    var b = this.syntax.builders;

    if (name === "class") {
      switch (value.type) {
        case "StringLiteral":
          return this.parseClasses(value.value);
        case "PathExpression":
          return this.parseClasses(value.original);
        case "SubExpression":
          return b.mustache(value.path, value.params, value.hash);
        default:
          Ember['default'].assert("Unsupported attribute value type: " + value.type);
      }
    } else {
      switch (value.type) {
        case "StringLiteral":
          return b.mustache(b.path(value.value));
        case "PathExpression":
          return b.mustache(value);
        case "SubExpression":
          return b.mustache(value.path, value.params, value.hash);
        default:
          Ember['default'].assert("Unsupported attribute value type: " + value.type);
      }
    }
  };

  TransformBindAttrToAttributes.prototype.parseClasses = function parseClasses(value) {
    var b = this.syntax.builders;

    var concat = b.concat();
    var classes = value.split(" ");

    for (var i = 0; i < classes.length; i++) {
      if (i > 0) {
        concat.parts.push(b.string(" "));
      }

      var concatPart = this.parseClass(classes[i]);
      concat.parts.push(concatPart);
    }

    return concat;
  };

  TransformBindAttrToAttributes.prototype.parseClass = function parseClass(value) {
    var b = this.syntax.builders;

    var parts = value.split(":");

    switch (parts.length) {
      case 1:
        // Before: {{bind-attr class="view.fooBar ..."}}
        // After: class="{{-bind-attr-class view.fooBar "foo-bar"}} ..."
        return b.sexpr(b.path("-bind-attr-class"), [b.path(parts[0]), b.string(dasherizeLastKey(parts[0]))]);
      case 2:
        if (parts[0] === "") {
          // Before: {{bind-attr class=":foo ..."}}
          // After: class="foo ..."
          return b.string(parts[1]);
        } else {
          // Before: {{bind-attr class="some.path:foo ..."}}
          // After: class="{{if some.path "foo" ""}} ..."
          return b.sexpr(b.path("if"), [b.path(parts[0]), b.string(parts[1]), b.string("")]);
        }
        break;
      case 3:
        // Before: {{bind-attr class="some.path:foo:bar ..."}}
        // After: class="{{if some.path "foo" "bar"}} ..."
        return b.sexpr(b.path("if"), [b.path(parts[0]), b.string(parts[1]), b.string(parts[2])]);
      default:
        Ember['default'].assert("Unsupported bind-attr class syntax: `" + value + "`");
    }
  };

  function isBindAttrModifier(modifier, moduleName) {
    var name = modifier.path.original;

    var _ref = modifier.path.loc.start || {};

    var column = _ref.column;
    var line = _ref.line;

    var moduleInfo = "";

    if (moduleName) {
      moduleInfo += "'" + moduleName + "' @ ";
    }

    if (line && column) {
      moduleInfo += "L" + line + ":C" + column;
    }

    if (moduleInfo) {
      moduleInfo = "(" + moduleInfo + ") ";
    }

    if (name === "bind-attr" || name === "bindAttr") {
      Ember['default'].deprecate("The `" + name + "` helper " + moduleInfo + "is deprecated in favor of " + "HTMLBars-style bound attributes.");
      return true;
    } else {
      return false;
    }
  }

  function assertAttrNameIsUnused(element, name) {
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];

      if (attr.name === name) {
        if (name === "class") {
          Ember['default'].assert("You cannot set `class` manually and via `{{bind-attr}}` helper " + "on the same element. Please use `{{bind-attr}}`'s `:static-class` " + "syntax instead.");
        } else {
          Ember['default'].assert("You cannot set `" + name + "` manually and via `{{bind-attr}}` " + "helper on the same element.");
        }
      }
    }
  }

  function dasherizeLastKey(path) {
    var parts = path.split(".");
    return string.dasherize(parts[parts.length - 1]);
  }

  exports['default'] = TransformBindAttrToAttributes;

});
enifed('ember-template-compiler/plugins/transform-component-attrs-into-mut', ['exports'], function (exports) {

  'use strict';

  function TransformComponentAttrsIntoMut() {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformComponentAttrsIntoMut.prototype.transform = function TransformBindAttrToAttributes_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      each(node.hash.pairs, function (pair) {
        var value = pair.value;

        if (value.type === 'PathExpression') {
          pair.value = b.sexpr(b.path('@mut'), [pair.value]);
        }
      });
    });

    return ast;
  };

  function validate(node) {
    return node.type === 'BlockStatement' || node.type === 'MustacheStatement';
  }

  function each(list, callback) {
    for (var i = 0, l = list.length; i < l; i++) {
      callback(list[i]);
    }
  }

  exports['default'] = TransformComponentAttrsIntoMut;

});
enifed('ember-template-compiler/plugins/transform-component-curly-to-readonly', ['exports'], function (exports) {

  'use strict';

  function TransformComponentCurlyToReadonly() {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformComponentCurlyToReadonly.prototype.transform = function TransformComponetnCurlyToReadonly_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      each(node.attributes, function (attr) {
        if (attr.value.type !== 'MustacheStatement') {
          return;
        }
        if (attr.value.params.length || attr.value.hash.pairs.length) {
          return;
        }

        attr.value = b.mustache(b.path('readonly'), [attr.value.path], null, !attr.value.escape);
      });
    });

    return ast;
  };

  function validate(node) {
    return node.type === 'ComponentNode';
  }

  function each(list, callback) {
    for (var i = 0, l = list.length; i < l; i++) {
      callback(list[i]);
    }
  }

  exports['default'] = TransformComponentCurlyToReadonly;

});
enifed('ember-template-compiler/plugins/transform-each-in-to-block-params', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember
  @submodule ember-htmlbars
  */

  /**
    An HTMLBars AST transformation that replaces all instances of

    ```handlebars
    {{#each item in items}}
    {{/each}}
    ```

    with

    ```handlebars
    {{#each items as |item|}}
    {{/each}}
    ```

    @class TransformEachInToBlockParams
    @private
  */
  function TransformEachInToBlockParams() {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformEachInToBlockParams.prototype.transform = function TransformEachInToBlockParams_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (validate(node)) {

        var removedParams = node.params.splice(0, 2);
        var keyword = removedParams[0].original;

        if (node.type === 'BlockStatement') {
          if (node.program.blockParams.length) {
            throw new Error('You cannot use keyword (`{{each foo in bar}}`) and block params (`{{each bar as |foo|}}`) at the same time.');
          }

          node.program.blockParams = [keyword];
        } else {
          node.hash.pairs.push(b.pair('keyword', b.string(keyword)));
        }
      }
    });

    return ast;
  };

  function validate(node) {
    return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') && node.path.original === 'each' && node.params.length === 3 && node.params[1].type === 'PathExpression' && node.params[1].original === 'in';
  }

  exports['default'] = TransformEachInToBlockParams;

});
enifed('ember-template-compiler/plugins/transform-each-in-to-hash', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember
  @submodule ember-htmlbars
  */

  /**
    An HTMLBars AST transformation that replaces all instances of

    ```handlebars
    {{#each item in items}}
    {{/each}}
    ```

    with

    ```handlebars
    {{#each items keyword="item"}}
    {{/each}}
    ```

    @class TransformEachInToHash
    @private
  */
  function TransformEachInToHash(options) {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
    this.options = options || {};
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformEachInToHash.prototype.transform = function TransformEachInToHash_transform(ast) {
    var pluginContext = this;
    var walker = new pluginContext.syntax.Walker();
    var b = pluginContext.syntax.builders;

    walker.visit(ast, function (node) {
      if (pluginContext.validate(node)) {

        if (node.program && node.program.blockParams.length) {
          throw new Error('You cannot use keyword (`{{each foo in bar}}`) and block params (`{{each bar as |foo|}}`) at the same time.');
        }

        var removedParams = node.sexpr.params.splice(0, 2);
        var keyword = removedParams[0].original;

        // TODO: This may not be necessary.
        if (!node.sexpr.hash) {
          node.sexpr.hash = b.hash();
        }

        node.sexpr.hash.pairs.push(b.pair('keyword', b.string(keyword)));
      }
    });

    return ast;
  };

  TransformEachInToHash.prototype.validate = function TransformEachInToHash_validate(node) {
    return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') && node.sexpr.path.original === 'each' && node.sexpr.params.length === 3 && node.sexpr.params[1].type === 'PathExpression' && node.sexpr.params[1].original === 'in';
  };

  exports['default'] = TransformEachInToHash;

});
enifed('ember-template-compiler/plugins/transform-each-into-collection', ['exports', 'ember-metal/core'], function (exports, Ember) {

  'use strict';



  exports['default'] = TransformEachIntoCollection;

  function TransformEachIntoCollection(options) {
    this.options = options;
    this.syntax = null;
  }

  TransformEachIntoCollection.prototype.transform = function TransformEachIntoCollection_transform(ast) {
    var options = this.options;
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      var legacyHashKey = validate(node);
      if (!legacyHashKey) {
        return;
      }

      var _ref = legacyHashKey.loc.start || {};

      var column = _ref.column;
      var line = _ref.line;

      var moduleInfo = '';
      if (options.moduleName) {
        moduleInfo += '\'' + options.moduleName + '\' ';
      }

      if (line && column) {
        moduleInfo += '@L' + line + ':C' + column;
      }

      Ember['default'].deprecate('Using \'' + legacyHashKey.key + '\' with \'{{each}}\' ' + moduleInfo + ' is deprecated.  Please refactor to a component.');

      var list = node.params.shift();
      node.path = b.path('collection');

      node.params.unshift(b.string('-legacy-each'));

      var pair = b.pair('content', list);
      pair.loc = list.loc;

      node.hash.pairs.push(pair);

      //pair = b.pair('dataSource', list);
      //node.hash.pairs.push(pair);
    });

    return ast;
  };

  function validate(node) {
    if ((node.type === 'BlockStatement' || node.type === 'MustacheStatement') && node.path.original === 'each') {

      return any(node.hash.pairs, function (pair) {
        var key = pair.key;
        return key === 'itemController' || key === 'itemView' || key === 'itemViewClass' || key === 'tagName' || key === 'emptyView' || key === 'emptyViewClass';
      });
    }

    return false;
  }

  function any(list, predicate) {
    for (var i = 0, l = list.length; i < l; i++) {
      if (predicate(list[i])) {
        return list[i];
      }
    }

    return false;
  }

});
enifed('ember-template-compiler/plugins/transform-item-class', ['exports'], function (exports) {

  'use strict';

  exports['default'] = TransformItemClass;

  function TransformItemClass() {
    this.syntax = null;
  }

  TransformItemClass.prototype.transform = function TransformItemClass_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      each(node.hash.pairs, function (pair) {
        var key = pair.key;
        var value = pair.value;

        if (key !== 'itemClass') {
          return;
        }
        if (value.type === 'StringLiteral') {
          return;
        }

        var propName = value.original;
        var params = [value];
        var sexprParams = [b.string(propName), b.path(propName)];

        params.push(b.sexpr(b.string('-normalize-class'), sexprParams));
        var sexpr = b.sexpr(b.string('if'), params);

        pair.value = sexpr;
      });
    });

    return ast;
  };

  function validate(node) {
    return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') && node.path.original === 'collection';
  }

  function each(list, callback) {
    for (var i = 0, l = list.length; i < l; i++) {
      callback(list[i]);
    }
  }

});
enifed('ember-template-compiler/plugins/transform-old-binding-syntax', ['exports', 'ember-metal/core'], function (exports, Ember) {

  'use strict';



  exports['default'] = TransformOldBindingSyntax;

  function TransformOldBindingSyntax() {
    this.syntax = null;
  }

  TransformOldBindingSyntax.prototype.transform = function TransformOldBindingSyntax_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      each(node.hash.pairs, function (pair) {
        var key = pair.key;
        var value = pair.value;

        var sourceInformation = '';

        if (pair.loc) {
          var _pair$loc = pair.loc;
          var start = _pair$loc.start;
          var source = _pair$loc.source;

          sourceInformation = '@ ' + start.line + ':' + start.column + ' in ' + (source || '(inline)');
        }

        if (key === 'classBinding') {
          return;
        }

        Ember['default'].assert('Setting \'attributeBindings\' via template helpers is not allowed ' + sourceInformation, key !== 'attributeBindings');

        if (key.substr(-7) === 'Binding') {
          var newKey = key.slice(0, -7);

          Ember['default'].deprecate('You\'re using legacy binding syntax: ' + key + '=' + exprToString(value) + ' ' + sourceInformation + '. Please replace with ' + newKey + '=' + value.original);

          pair.key = newKey;
          if (value.type === 'StringLiteral') {
            pair.value = b.path(value.original);
          }
        }
      });
    });

    return ast;
  };

  function validate(node) {
    return node.type === 'BlockStatement' || node.type === 'MustacheStatement';
  }

  function each(list, callback) {
    for (var i = 0, l = list.length; i < l; i++) {
      callback(list[i]);
    }
  }

  function exprToString(expr) {
    switch (expr.type) {
      case 'StringLiteral':
        return '"' + expr.original + '"';
      case 'PathExpression':
        return expr.original;
    }
  }

});
enifed('ember-template-compiler/plugins/transform-old-class-binding-syntax', ['exports', 'ember-metal/core'], function (exports, Ember) {

  'use strict';



  exports['default'] = TransformOldClassBindingSyntax;

  function TransformOldClassBindingSyntax() {
    this.syntax = null;
  }

  TransformOldClassBindingSyntax.prototype.transform = function TransformOldClassBindingSyntax_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      var allOfTheMicrosyntaxes = [];
      var allOfTheMicrosyntaxIndexes = [];
      var classPair = undefined;

      each(node.hash.pairs, function (pair, index) {
        var key = pair.key;

        if (key === 'classBinding' || key === 'classNameBindings') {
          allOfTheMicrosyntaxIndexes.push(index);
          allOfTheMicrosyntaxes.push(pair);
        } else if (key === 'class') {
          classPair = pair;
        }
      });

      if (allOfTheMicrosyntaxes.length === 0) {
        return;
      }

      var classValue = [];

      if (classPair) {
        classValue.push(classPair.value);
      } else {
        classPair = b.pair('class', null);
        node.hash.pairs.push(classPair);
      }

      each(allOfTheMicrosyntaxIndexes, function (index) {
        node.hash.pairs.splice(index, 1);
      });

      each(allOfTheMicrosyntaxes, function (_ref) {
        var value = _ref.value;
        var loc = _ref.loc;

        var sexprs = [];

        var sourceInformation = '';
        if (loc) {
          var start = loc.start;
          var source = loc.source;

          sourceInformation = '@ ' + start.line + ':' + start.column + ' in ' + (source || '(inline)');
        }

        // TODO: Parse the microsyntax and offer the correct information
        Ember['default'].deprecate('You\'re using legacy class binding syntax: classBinding=' + exprToString(value) + ' ' + sourceInformation + '. Please replace with class=""');

        if (value.type === 'StringLiteral') {
          var microsyntax = parseMicrosyntax(value.original);

          buildSexprs(microsyntax, sexprs, b);

          classValue.push.apply(classValue, sexprs);
        }
      });

      var hash = b.hash([b.pair('separator', b.string(' '))]);
      classPair.value = b.sexpr(b.string('-concat'), classValue, hash);
    });

    return ast;
  };

  function buildSexprs(microsyntax, sexprs, b) {
    for (var i = 0, l = microsyntax.length; i < l; i++) {
      var _microsyntax$i = microsyntax[i];
      var propName = _microsyntax$i[0];
      var activeClass = _microsyntax$i[1];
      var inactiveClass = _microsyntax$i[2];

      var sexpr = undefined;

      // :my-class-name microsyntax for static values
      if (propName === '') {
        sexpr = b.string(activeClass);
      } else {
        var params = [b.path(propName)];

        if (activeClass) {
          params.push(b.string(activeClass));
        } else {
          var sexprParams = [b.string(propName), b.path(propName)];

          var hash = b.hash();
          if (activeClass !== undefined) {
            hash.pairs.push(b.pair('activeClass', b.string(activeClass)));
          }

          if (inactiveClass !== undefined) {
            hash.pairs.push(b.pair('inactiveClass', b.string(inactiveClass)));
          }

          params.push(b.sexpr(b.string('-normalize-class'), sexprParams, hash));
        }

        if (inactiveClass) {
          params.push(b.string(inactiveClass));
        }

        sexpr = b.sexpr(b.string('if'), params);
      }

      sexprs.push(sexpr);
    }
  }

  function validate(node) {
    return node.type === 'BlockStatement' || node.type === 'MustacheStatement';
  }

  function each(list, callback) {
    for (var i = 0, l = list.length; i < l; i++) {
      callback(list[i], i);
    }
  }

  function parseMicrosyntax(string) {
    var segments = string.split(' ');

    for (var i = 0, l = segments.length; i < l; i++) {
      segments[i] = segments[i].split(':');
    }

    return segments;
  }

  function exprToString(expr) {
    switch (expr.type) {
      case 'StringLiteral':
        return '"' + expr.original + '"';
      case 'PathExpression':
        return expr.original;
    }
  }

});
enifed('ember-template-compiler/plugins/transform-single-arg-each', ['exports'], function (exports) {

  'use strict';

  exports['default'] = TransformSingleArgEach;

  function TransformSingleArgEach() {
    this.syntax = null;
  }

  TransformSingleArgEach.prototype.transform = function TransformSingleArgEach_transform(ast) {
    var b = this.syntax.builders;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function (node) {
      if (!validate(node)) {
        return;
      }

      node.params.push(b.path('this'));
    });

    return ast;
  };

  function validate(node) {
    return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') && node.path.original === 'each' && node.params.length === 0;
  }

});
enifed('ember-template-compiler/plugins/transform-with-as-to-hash', ['exports'], function (exports) {

  'use strict';

  /**
  @module ember
  @submodule ember-htmlbars
  */

  /**
    An HTMLBars AST transformation that replaces all instances of

    ```handlebars
    {{#with foo.bar as bar}}
    {{/with}}
    ```

    with

    ```handlebars
    {{#with foo.bar as |bar|}}
    {{/with}}
    ```

    @private
    @class TransformWithAsToHash
  */
  function TransformWithAsToHash(options) {
    // set later within HTMLBars to the syntax package
    this.syntax = null;
    this.options = options || {};
  }

  /**
    @private
    @method transform
    @param {AST} The AST to be transformed.
  */
  TransformWithAsToHash.prototype.transform = function TransformWithAsToHash_transform(ast) {
    var pluginContext = this;
    var walker = new pluginContext.syntax.Walker();
    var moduleName = this.options.moduleName;

    walker.visit(ast, function (node) {
      if (pluginContext.validate(node)) {

        if (node.program && node.program.blockParams.length) {
          throw new Error("You cannot use keyword (`{{with foo as bar}}`) and block params (`{{with foo as |bar|}}`) at the same time.");
        }

        Ember.deprecate("Using {{with}} without block syntax is deprecated. " + "Please use standard block form (`{{#with foo as |bar|}}`) " + (moduleName ? " in `" + moduleName + "` " : "") + "instead.", false, { url: "http://emberjs.com/deprecations/v1.x/#toc_code-as-code-sytnax-for-code-with-code" });

        var removedParams = node.params.splice(1, 2);
        var keyword = removedParams[1].original;
        node.program.blockParams = [keyword];
      }
    });

    return ast;
  };

  TransformWithAsToHash.prototype.validate = function TransformWithAsToHash_validate(node) {
    return node.type === "BlockStatement" && node.path.original === "with" && node.params.length === 3 && node.params[1].type === "PathExpression" && node.params[1].original === "as";
  };

  exports['default'] = TransformWithAsToHash;

});
enifed('ember-template-compiler/system/compile', ['exports', 'ember-template-compiler/system/compile_options', 'ember-template-compiler/system/template'], function (exports, compileOptions, template) {

  'use strict';


  var compile; /**
                 Uses HTMLBars `compile` function to process a string into a compiled template.
               
                 This is not present in production builds.
               
                 @private
                 @method compile
                 @param {String} templateString This is the string to be compiled by HTMLBars.
                 @param {Object} options This is an options hash to augment the compiler options.
               */
  exports['default'] = function (templateString, options) {
    if (!compile && Ember.__loader.registry["htmlbars-compiler/compiler"]) {
      compile = requireModule("htmlbars-compiler/compiler").compile;
    }

    if (!compile) {
      throw new Error("Cannot call `compile` without the template compiler loaded. Please load `ember-template-compiler.js` prior to calling `compile`.");
    }

    var templateSpec = compile(templateString, compileOptions['default'](options));

    return template['default'](templateSpec);
  }

});
enifed('ember-template-compiler/system/compile_options', ['exports', 'ember-metal/core', 'ember-template-compiler/plugins'], function (exports, Ember, plugins) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */

  exports['default'] = function (_options) {
    var disableComponentGeneration = true;
    
      disableComponentGeneration = false;
    

    var options = _options || {};
    // When calling `Ember.Handlebars.compile()` a second argument of `true`
    // had a special meaning (long since lost), this just gaurds against
    // `options` being true, and causing an error during compilation.
    if (options === true) {
      options = {};
    }

    options.disableComponentGeneration = disableComponentGeneration;
    options.plugins = plugins['default'];

    options.buildMeta = function buildMeta(program) {
      return {
        revision: "Ember@1.13.0-beta.1.ce345f0e",
        loc: program.loc,
        moduleName: options.moduleName
      };
    };

    return options;
  }

});
enifed('ember-template-compiler/system/precompile', ['exports', 'ember-template-compiler/system/compile_options'], function (exports, compileOptions) {

  'use strict';

  /**
  @module ember
  @submodule ember-template-compiler
  */

  var compileSpec;

  /**
    Uses HTMLBars `compile` function to process a string into a compiled template string.
    The returned string must be passed through `Ember.HTMLBars.template`.

    This is not present in production builds.

    @private
    @method precompile
    @param {String} templateString This is the string to be compiled by HTMLBars.
  */
  exports['default'] = function (templateString, options) {
    if (!compileSpec && Ember.__loader.registry['htmlbars-compiler/compiler']) {
      compileSpec = requireModule('htmlbars-compiler/compiler').compileSpec;
    }

    if (!compileSpec) {
      throw new Error('Cannot call `compileSpec` without the template compiler loaded. Please load `ember-template-compiler.js` prior to calling `compileSpec`.');
    }

    return compileSpec(templateString, compileOptions['default'](options));
  }

});
enifed('ember-template-compiler/system/string', ['exports'], function (exports) {

  'use strict';

  exports.decamelize = decamelize;
  exports.dasherize = dasherize;

  var STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
  var STRING_DASHERIZE_REGEXP = /[ _]/g;
  function decamelize(str) {
    return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
  }

  function dasherize(str) {
    return decamelize(str).replace(STRING_DASHERIZE_REGEXP, '-');
  }

});
enifed('ember-template-compiler/system/template', ['exports', 'htmlbars-runtime/hooks'], function (exports, hooks) {

  'use strict';

  exports['default'] = function (templateSpec) {
    if (!templateSpec.render) {
      templateSpec = hooks.wrap(templateSpec);
    }

    templateSpec.isTop = true;
    templateSpec.isMethod = false;

    return templateSpec;
  }

});
enifed('htmlbars-compiler', ['exports', './htmlbars-compiler/compiler'], function (exports, compiler) {

  'use strict';



  exports.compile = compiler.compile;
  exports.compileSpec = compiler.compileSpec;
  exports.template = compiler.template;

});
enifed('htmlbars-compiler/compiler', ['exports', '../htmlbars-syntax/parser', './template-compiler', '../htmlbars-runtime/hooks', '../htmlbars-runtime/render'], function (exports, parser, TemplateCompiler, hooks, render) {

  'use strict';

  exports.compileSpec = compileSpec;
  exports.template = template;
  exports.compile = compile;

  /*
   * Compile a string into a template spec string. The template spec is a string
   * representation of a template. Usually, you would use compileSpec for
   * pre-compilation of a template on the server.
   *
   * Example usage:
   *
   *     var templateSpec = compileSpec("Howdy {{name}}");
   *     // This next step is basically what plain compile does
   *     var template = new Function("return " + templateSpec)();
   *
   * @method compileSpec
   * @param {String} string An HTMLBars template string
   * @return {TemplateSpec} A template spec string
   */
  function compileSpec(string, options) {
    var ast = parser.preprocess(string, options);
    var compiler = new TemplateCompiler['default'](options);
    var program = compiler.compile(ast);
    return program;
  }

  function template(templateSpec) {
    return new Function("return " + templateSpec)();
  }

  function compile(string, options) {
    return hooks.wrap(template(compileSpec(string, options)), render['default']);
  }

});
enifed('htmlbars-compiler/fragment-javascript-compiler', ['exports', './utils', '../htmlbars-util/quoting'], function (exports, utils, quoting) {

  'use strict';

  var svgNamespace = "http://www.w3.org/2000/svg",

  // http://www.w3.org/html/wg/drafts/html/master/syntax.html#html-integration-point
  svgHTMLIntegrationPoints = { "foreignObject": true, "desc": true, "title": true };

  function FragmentJavaScriptCompiler() {
    this.source = [];
    this.depth = -1;
  }

  exports['default'] = FragmentJavaScriptCompiler;

  FragmentJavaScriptCompiler.prototype.compile = function (opcodes, options) {
    this.source.length = 0;
    this.depth = -1;
    this.indent = options && options.indent || "";
    this.namespaceFrameStack = [{ namespace: null, depth: null }];
    this.domNamespace = null;

    this.source.push("function buildFragment(dom) {\n");
    utils.processOpcodes(this, opcodes);
    this.source.push(this.indent + "}");

    return this.source.join("");
  };

  FragmentJavaScriptCompiler.prototype.createFragment = function () {
    var el = "el" + ++this.depth;
    this.source.push(this.indent + "  var " + el + " = dom.createDocumentFragment();\n");
  };

  FragmentJavaScriptCompiler.prototype.createElement = function (tagName) {
    var el = "el" + ++this.depth;
    if (tagName === "svg") {
      this.pushNamespaceFrame({ namespace: svgNamespace, depth: this.depth });
    }
    this.ensureNamespace();
    this.source.push(this.indent + "  var " + el + " = dom.createElement(" + quoting.string(tagName) + ");\n");
    if (svgHTMLIntegrationPoints[tagName]) {
      this.pushNamespaceFrame({ namespace: null, depth: this.depth });
    }
  };

  FragmentJavaScriptCompiler.prototype.createText = function (str) {
    var el = "el" + ++this.depth;
    this.source.push(this.indent + "  var " + el + " = dom.createTextNode(" + quoting.string(str) + ");\n");
  };

  FragmentJavaScriptCompiler.prototype.createComment = function (str) {
    var el = "el" + ++this.depth;
    this.source.push(this.indent + "  var " + el + " = dom.createComment(" + quoting.string(str) + ");\n");
  };

  FragmentJavaScriptCompiler.prototype.returnNode = function () {
    var el = "el" + this.depth;
    this.source.push(this.indent + "  return " + el + ";\n");
  };

  FragmentJavaScriptCompiler.prototype.setAttribute = function (name, value, namespace) {
    var el = "el" + this.depth;
    if (namespace) {
      this.source.push(this.indent + "  dom.setAttributeNS(" + el + "," + quoting.string(namespace) + "," + quoting.string(name) + "," + quoting.string(value) + ");\n");
    } else {
      this.source.push(this.indent + "  dom.setAttribute(" + el + "," + quoting.string(name) + "," + quoting.string(value) + ");\n");
    }
  };

  FragmentJavaScriptCompiler.prototype.appendChild = function () {
    if (this.depth === this.getCurrentNamespaceFrame().depth) {
      this.popNamespaceFrame();
    }
    var child = "el" + this.depth--;
    var el = "el" + this.depth;
    this.source.push(this.indent + "  dom.appendChild(" + el + ", " + child + ");\n");
  };

  FragmentJavaScriptCompiler.prototype.getCurrentNamespaceFrame = function () {
    return this.namespaceFrameStack[this.namespaceFrameStack.length - 1];
  };

  FragmentJavaScriptCompiler.prototype.pushNamespaceFrame = function (frame) {
    this.namespaceFrameStack.push(frame);
  };

  FragmentJavaScriptCompiler.prototype.popNamespaceFrame = function () {
    return this.namespaceFrameStack.pop();
  };

  FragmentJavaScriptCompiler.prototype.ensureNamespace = function () {
    var correctNamespace = this.getCurrentNamespaceFrame().namespace;
    if (this.domNamespace !== correctNamespace) {
      this.source.push(this.indent + "  dom.setNamespace(" + (correctNamespace ? quoting.string(correctNamespace) : "null") + ");\n");
      this.domNamespace = correctNamespace;
    }
  };

});
enifed('htmlbars-compiler/fragment-opcode-compiler', ['exports', './template-visitor', './utils', '../htmlbars-util', '../htmlbars-util/array-utils'], function (exports, TemplateVisitor, utils, htmlbars_util, array_utils) {

  'use strict';

  function FragmentOpcodeCompiler() {
    this.opcodes = [];
  }

  exports['default'] = FragmentOpcodeCompiler;

  FragmentOpcodeCompiler.prototype.compile = function (ast) {
    var templateVisitor = new TemplateVisitor['default']();
    templateVisitor.visit(ast);

    utils.processOpcodes(this, templateVisitor.actions);

    return this.opcodes;
  };

  FragmentOpcodeCompiler.prototype.opcode = function (type, params) {
    this.opcodes.push([type, params]);
  };

  FragmentOpcodeCompiler.prototype.text = function (text) {
    this.opcode("createText", [text.chars]);
    this.opcode("appendChild");
  };

  FragmentOpcodeCompiler.prototype.comment = function (comment) {
    this.opcode("createComment", [comment.value]);
    this.opcode("appendChild");
  };

  FragmentOpcodeCompiler.prototype.openElement = function (element) {
    this.opcode("createElement", [element.tag]);
    array_utils.forEach(element.attributes, this.attribute, this);
  };

  FragmentOpcodeCompiler.prototype.closeElement = function () {
    this.opcode("appendChild");
  };

  FragmentOpcodeCompiler.prototype.startProgram = function () {
    this.opcodes.length = 0;
    this.opcode("createFragment");
  };

  FragmentOpcodeCompiler.prototype.endProgram = function () {
    this.opcode("returnNode");
  };

  FragmentOpcodeCompiler.prototype.mustache = function () {
    this.pushMorphPlaceholderNode();
  };

  FragmentOpcodeCompiler.prototype.component = function () {
    this.pushMorphPlaceholderNode();
  };

  FragmentOpcodeCompiler.prototype.block = function () {
    this.pushMorphPlaceholderNode();
  };

  FragmentOpcodeCompiler.prototype.pushMorphPlaceholderNode = function () {
    this.opcode("createComment", [""]);
    this.opcode("appendChild");
  };

  FragmentOpcodeCompiler.prototype.attribute = function (attr) {
    if (attr.value.type === "TextNode") {
      var namespace = htmlbars_util.getAttrNamespace(attr.name);
      this.opcode("setAttribute", [attr.name, attr.value.chars, namespace]);
    }
  };

  FragmentOpcodeCompiler.prototype.setNamespace = function (namespace) {
    this.opcode("setNamespace", [namespace]);
  };

});
enifed('htmlbars-compiler/hydration-javascript-compiler', ['exports', './utils', '../htmlbars-util/quoting'], function (exports, utils, quoting) {

  'use strict';

  function HydrationJavaScriptCompiler() {
    this.stack = [];
    this.source = [];
    this.mustaches = [];
    this.parents = [["fragment"]];
    this.parentCount = 0;
    this.morphs = [];
    this.fragmentProcessing = [];
    this.hooks = undefined;
  }

  exports['default'] = HydrationJavaScriptCompiler;

  var prototype = HydrationJavaScriptCompiler.prototype;

  prototype.compile = function (opcodes, options) {
    this.stack.length = 0;
    this.mustaches.length = 0;
    this.source.length = 0;
    this.parents.length = 1;
    this.parents[0] = ["fragment"];
    this.morphs.length = 0;
    this.fragmentProcessing.length = 0;
    this.parentCount = 0;
    this.indent = options && options.indent || "";
    this.hooks = {};
    this.hasOpenBoundary = false;
    this.hasCloseBoundary = false;
    this.statements = [];
    this.expressionStack = [];
    this.locals = [];
    this.hasOpenBoundary = false;
    this.hasCloseBoundary = false;

    utils.processOpcodes(this, opcodes);

    if (this.hasOpenBoundary) {
      this.source.unshift(this.indent + "  dom.insertBoundary(fragment, 0);\n");
    }

    if (this.hasCloseBoundary) {
      this.source.unshift(this.indent + "  dom.insertBoundary(fragment, null);\n");
    }

    var i, l;

    var indent = this.indent;

    var morphs;

    var result = {
      createMorphsProgram: "",
      hydrateMorphsProgram: "",
      fragmentProcessingProgram: "",
      statements: this.statements,
      locals: this.locals,
      hasMorphs: false
    };

    result.hydrateMorphsProgram = this.source.join("");

    if (this.morphs.length) {
      result.hasMorphs = true;
      morphs = indent + "  var morphs = new Array(" + this.morphs.length + ");\n";

      for (i = 0, l = this.morphs.length; i < l; ++i) {
        var morph = this.morphs[i];
        morphs += indent + "  morphs[" + i + "] = " + morph + ";\n";
      }
    }

    if (this.fragmentProcessing.length) {
      var processing = "";
      for (i = 0, l = this.fragmentProcessing.length; i < l; ++i) {
        processing += this.indent + "  " + this.fragmentProcessing[i] + "\n";
      }
      result.fragmentProcessingProgram = processing;
    }

    var createMorphsProgram;
    if (result.hasMorphs) {
      createMorphsProgram = "function buildRenderNodes(dom, fragment, contextualElement) {\n" + result.fragmentProcessingProgram + morphs;

      if (this.hasOpenBoundary) {
        createMorphsProgram += indent + "  dom.insertBoundary(fragment, 0);\n";
      }

      if (this.hasCloseBoundary) {
        createMorphsProgram += indent + "  dom.insertBoundary(fragment, null);\n";
      }

      createMorphsProgram += indent + "  return morphs;\n" + indent + "}";
    } else {
      createMorphsProgram = "function buildRenderNodes() { return []; }";
    }

    result.createMorphsProgram = createMorphsProgram;

    return result;
  };

  prototype.prepareArray = function (length) {
    var values = [];

    for (var i = 0; i < length; i++) {
      values.push(this.expressionStack.pop());
    }

    this.expressionStack.push(values);
  };

  prototype.prepareObject = function (size) {
    var pairs = [];

    for (var i = 0; i < size; i++) {
      pairs.push(this.expressionStack.pop(), this.expressionStack.pop());
    }

    this.expressionStack.push(pairs);
  };

  prototype.openBoundary = function () {
    this.hasOpenBoundary = true;
  };

  prototype.closeBoundary = function () {
    this.hasCloseBoundary = true;
  };

  prototype.pushLiteral = function (value) {
    this.expressionStack.push(value);
  };

  prototype.pushGetHook = function (path) {
    this.expressionStack.push(["get", path]);
  };

  prototype.pushSexprHook = function () {
    this.expressionStack.push(["subexpr", this.expressionStack.pop(), this.expressionStack.pop(), this.expressionStack.pop()]);
  };

  prototype.pushConcatHook = function () {
    this.expressionStack.push(["concat", this.expressionStack.pop()]);
  };

  prototype.printSetHook = function (name) {
    this.locals.push(name);
  };

  prototype.printBlockHook = function (templateId, inverseId) {
    this.statements.push(["block", this.expressionStack.pop(), // path
    this.expressionStack.pop(), // params
    this.expressionStack.pop(), // hash
    templateId, inverseId]);
  };

  prototype.printInlineHook = function () {
    var path = this.expressionStack.pop();
    var params = this.expressionStack.pop();
    var hash = this.expressionStack.pop();

    this.statements.push(["inline", path, params, hash]);
  };

  prototype.printContentHook = function () {
    this.statements.push(["content", this.expressionStack.pop()]);
  };

  prototype.printComponentHook = function (templateId) {
    this.statements.push(["component", this.expressionStack.pop(), // path
    this.expressionStack.pop(), // attrs
    templateId]);
  };

  prototype.printAttributeHook = function () {
    this.statements.push(["attribute", this.expressionStack.pop(), // name
    this.expressionStack.pop() // value;
    ]);
  };

  prototype.printElementHook = function () {
    this.statements.push(["element", this.expressionStack.pop(), // path
    this.expressionStack.pop(), // params
    this.expressionStack.pop() // hash
    ]);
  };

  prototype.createMorph = function (morphNum, parentPath, startIndex, endIndex, escaped) {
    var isRoot = parentPath.length === 0;
    var parent = this.getParent();

    var morphMethod = escaped ? "createMorphAt" : "createUnsafeMorphAt";
    var morph = "dom." + morphMethod + "(" + parent + "," + (startIndex === null ? "-1" : startIndex) + "," + (endIndex === null ? "-1" : endIndex) + (isRoot ? ",contextualElement)" : ")");

    this.morphs[morphNum] = morph;
  };

  prototype.createAttrMorph = function (attrMorphNum, elementNum, name, escaped, namespace) {
    var morphMethod = escaped ? "createAttrMorph" : "createUnsafeAttrMorph";
    var morph = "dom." + morphMethod + "(element" + elementNum + ", '" + name + (namespace ? "', '" + namespace : "") + "')";
    this.morphs[attrMorphNum] = morph;
  };

  prototype.createElementMorph = function (morphNum, elementNum) {
    var morphMethod = "createElementMorph";
    var morph = "dom." + morphMethod + "(element" + elementNum + ")";
    this.morphs[morphNum] = morph;
  };

  prototype.repairClonedNode = function (blankChildTextNodes, isElementChecked) {
    var parent = this.getParent(),
        processing = "if (this.cachedFragment) { dom.repairClonedNode(" + parent + "," + quoting.array(blankChildTextNodes) + (isElementChecked ? ",true" : "") + "); }";
    this.fragmentProcessing.push(processing);
  };

  prototype.shareElement = function (elementNum) {
    var elementNodesName = "element" + elementNum;
    this.fragmentProcessing.push("var " + elementNodesName + " = " + this.getParent() + ";");
    this.parents[this.parents.length - 1] = [elementNodesName];
  };

  prototype.consumeParent = function (i) {
    var newParent = this.lastParent().slice();
    newParent.push(i);

    this.parents.push(newParent);
  };

  prototype.popParent = function () {
    this.parents.pop();
  };

  prototype.getParent = function () {
    var last = this.lastParent().slice();
    var frag = last.shift();

    if (!last.length) {
      return frag;
    }

    return "dom.childAt(" + frag + ", [" + last.join(", ") + "])";
  };

  prototype.lastParent = function () {
    return this.parents[this.parents.length - 1];
  };

});
enifed('htmlbars-compiler/hydration-opcode-compiler', ['exports', './template-visitor', './utils', '../htmlbars-util', '../htmlbars-util/array-utils', '../htmlbars-syntax/utils'], function (exports, TemplateVisitor, utils, htmlbars_util, array_utils, htmlbars_syntax__utils) {

  'use strict';

  function detectIsElementChecked(element) {
    for (var i = 0, len = element.attributes.length; i < len; i++) {
      if (element.attributes[i].name === "checked") {
        return true;
      }
    }
    return false;
  }

  function HydrationOpcodeCompiler() {
    this.opcodes = [];
    this.paths = [];
    this.templateId = 0;
    this.currentDOMChildIndex = 0;
    this.morphs = [];
    this.morphNum = 0;
    this.element = null;
    this.elementNum = -1;
  }

  exports['default'] = HydrationOpcodeCompiler;

  HydrationOpcodeCompiler.prototype.compile = function (ast) {
    var templateVisitor = new TemplateVisitor['default']();
    templateVisitor.visit(ast);

    utils.processOpcodes(this, templateVisitor.actions);

    return this.opcodes;
  };

  HydrationOpcodeCompiler.prototype.accept = function (node) {
    this[node.type](node);
  };

  HydrationOpcodeCompiler.prototype.opcode = function (type) {
    var params = [].slice.call(arguments, 1);
    this.opcodes.push([type, params]);
  };

  HydrationOpcodeCompiler.prototype.startProgram = function (program, c, blankChildTextNodes) {
    this.opcodes.length = 0;
    this.paths.length = 0;
    this.morphs.length = 0;
    this.templateId = 0;
    this.currentDOMChildIndex = -1;
    this.morphNum = 0;

    var blockParams = program.blockParams || [];

    for (var i = 0; i < blockParams.length; i++) {
      this.opcode("printSetHook", blockParams[i], i);
    }

    if (blankChildTextNodes.length > 0) {
      this.opcode("repairClonedNode", blankChildTextNodes);
    }
  };

  HydrationOpcodeCompiler.prototype.insertBoundary = function (first) {
    this.opcode(first ? "openBoundary" : "closeBoundary");
  };

  HydrationOpcodeCompiler.prototype.endProgram = function () {
    distributeMorphs(this.morphs, this.opcodes);
  };

  HydrationOpcodeCompiler.prototype.text = function () {
    ++this.currentDOMChildIndex;
  };

  HydrationOpcodeCompiler.prototype.comment = function () {
    ++this.currentDOMChildIndex;
  };

  HydrationOpcodeCompiler.prototype.openElement = function (element, pos, len, mustacheCount, blankChildTextNodes) {
    distributeMorphs(this.morphs, this.opcodes);
    ++this.currentDOMChildIndex;

    this.element = this.currentDOMChildIndex;

    this.opcode("consumeParent", this.currentDOMChildIndex);

    // If our parent reference will be used more than once, cache its reference.
    if (mustacheCount > 1) {
      shareElement(this);
    }

    var isElementChecked = detectIsElementChecked(element);
    if (blankChildTextNodes.length > 0 || isElementChecked) {
      this.opcode("repairClonedNode", blankChildTextNodes, isElementChecked);
    }

    this.paths.push(this.currentDOMChildIndex);
    this.currentDOMChildIndex = -1;

    array_utils.forEach(element.attributes, this.attribute, this);
    array_utils.forEach(element.modifiers, this.elementModifier, this);
  };

  HydrationOpcodeCompiler.prototype.closeElement = function () {
    distributeMorphs(this.morphs, this.opcodes);
    this.opcode("popParent");
    this.currentDOMChildIndex = this.paths.pop();
  };

  HydrationOpcodeCompiler.prototype.mustache = function (mustache, childIndex, childCount) {
    this.pushMorphPlaceholderNode(childIndex, childCount);

    var opcode;

    if (htmlbars_syntax__utils.isHelper(mustache)) {
      prepareHash(this, mustache.hash);
      prepareParams(this, mustache.params);
      preparePath(this, mustache.path);
      opcode = "printInlineHook";
    } else {
      preparePath(this, mustache.path);
      opcode = "printContentHook";
    }

    var morphNum = this.morphNum++;
    var start = this.currentDOMChildIndex;
    var end = this.currentDOMChildIndex;
    this.morphs.push([morphNum, this.paths.slice(), start, end, mustache.escaped]);

    this.opcode(opcode);
  };

  HydrationOpcodeCompiler.prototype.block = function (block, childIndex, childCount) {
    this.pushMorphPlaceholderNode(childIndex, childCount);

    prepareHash(this, block.hash);
    prepareParams(this, block.params);
    preparePath(this, block.path);

    var morphNum = this.morphNum++;
    var start = this.currentDOMChildIndex;
    var end = this.currentDOMChildIndex;
    this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

    var templateId = this.templateId++;
    var inverseId = block.inverse === null ? null : this.templateId++;

    this.opcode("printBlockHook", templateId, inverseId);
  };

  HydrationOpcodeCompiler.prototype.component = function (component, childIndex, childCount) {
    this.pushMorphPlaceholderNode(childIndex, childCount);

    var program = component.program || {};
    var blockParams = program.blockParams || [];

    var attrs = component.attributes;
    for (var i = attrs.length - 1; i >= 0; i--) {
      var name = attrs[i].name;
      var value = attrs[i].value;

      // TODO: Introduce context specific AST nodes to avoid switching here.
      if (value.type === "TextNode") {
        this.opcode("pushLiteral", value.chars);
      } else if (value.type === "MustacheStatement") {
        this.accept(htmlbars_syntax__utils.unwrapMustache(value));
      } else if (value.type === "ConcatStatement") {
        prepareParams(this, value.parts);
        this.opcode("pushConcatHook", this.morphNum);
      }

      this.opcode("pushLiteral", name);
    }

    var morphNum = this.morphNum++;
    var start = this.currentDOMChildIndex;
    var end = this.currentDOMChildIndex;
    this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

    this.opcode("prepareObject", attrs.length);
    this.opcode("pushLiteral", component.tag);
    this.opcode("printComponentHook", this.templateId++, blockParams.length);
  };

  HydrationOpcodeCompiler.prototype.attribute = function (attr) {
    var value = attr.value;
    var escaped = true;
    var namespace = htmlbars_util.getAttrNamespace(attr.name);

    // TODO: Introduce context specific AST nodes to avoid switching here.
    if (value.type === "TextNode") {
      return;
    } else if (value.type === "MustacheStatement") {
      escaped = value.escaped;
      this.accept(htmlbars_syntax__utils.unwrapMustache(value));
    } else if (value.type === "ConcatStatement") {
      prepareParams(this, value.parts);
      this.opcode("pushConcatHook", this.morphNum);
    }

    this.opcode("pushLiteral", attr.name);

    var attrMorphNum = this.morphNum++;

    if (this.element !== null) {
      shareElement(this);
    }

    this.opcode("createAttrMorph", attrMorphNum, this.elementNum, attr.name, escaped, namespace);
    this.opcode("printAttributeHook");
  };

  HydrationOpcodeCompiler.prototype.elementModifier = function (modifier) {
    prepareHash(this, modifier.hash);
    prepareParams(this, modifier.params);
    preparePath(this, modifier.path);

    // If we have a helper in a node, and this element has not been cached, cache it
    if (this.element !== null) {
      shareElement(this);
    }

    publishElementMorph(this);
    this.opcode("printElementHook");
  };

  HydrationOpcodeCompiler.prototype.pushMorphPlaceholderNode = function (childIndex, childCount) {
    if (this.paths.length === 0) {
      if (childIndex === 0) {
        this.opcode("openBoundary");
      }
      if (childIndex === childCount - 1) {
        this.opcode("closeBoundary");
      }
    }
    this.comment();
  };

  HydrationOpcodeCompiler.prototype.MustacheStatement = function (mustache) {
    prepareHash(this, mustache.hash);
    prepareParams(this, mustache.params);
    preparePath(this, mustache.path);
    this.opcode("pushSexprHook");
  };

  HydrationOpcodeCompiler.prototype.SubExpression = function (sexpr) {
    prepareHash(this, sexpr.hash);
    prepareParams(this, sexpr.params);
    preparePath(this, sexpr.path);
    this.opcode("pushSexprHook");
  };

  HydrationOpcodeCompiler.prototype.PathExpression = function (path) {
    this.opcode("pushGetHook", path.original);
  };

  HydrationOpcodeCompiler.prototype.StringLiteral = function (node) {
    this.opcode("pushLiteral", node.value);
  };

  HydrationOpcodeCompiler.prototype.BooleanLiteral = function (node) {
    this.opcode("pushLiteral", node.value);
  };

  HydrationOpcodeCompiler.prototype.NumberLiteral = function (node) {
    this.opcode("pushLiteral", node.value);
  };

  HydrationOpcodeCompiler.prototype.UndefinedLiteral = function (node) {
    this.opcode("pushLiteral", node.value);
  };

  HydrationOpcodeCompiler.prototype.NullLiteral = function (node) {
    this.opcode("pushLiteral", node.value);
  };

  function preparePath(compiler, path) {
    compiler.opcode("pushLiteral", path.original);
  }

  function prepareParams(compiler, params) {
    for (var i = params.length - 1; i >= 0; i--) {
      var param = params[i];
      compiler[param.type](param);
    }

    compiler.opcode("prepareArray", params.length);
  }

  function prepareHash(compiler, hash) {
    var pairs = hash.pairs;

    for (var i = pairs.length - 1; i >= 0; i--) {
      var key = pairs[i].key;
      var value = pairs[i].value;

      compiler[value.type](value);
      compiler.opcode("pushLiteral", key);
    }

    compiler.opcode("prepareObject", pairs.length);
  }

  function shareElement(compiler) {
    compiler.opcode("shareElement", ++compiler.elementNum);
    compiler.element = null; // Set element to null so we don't cache it twice
  }

  function publishElementMorph(compiler) {
    var morphNum = compiler.morphNum++;
    compiler.opcode("createElementMorph", morphNum, compiler.elementNum);
  }

  function distributeMorphs(morphs, opcodes) {
    if (morphs.length === 0) {
      return;
    }

    // Splice morphs after the most recent shareParent/consumeParent.
    var o;
    for (o = opcodes.length - 1; o >= 0; --o) {
      var opcode = opcodes[o][0];
      if (opcode === "shareElement" || opcode === "consumeParent" || opcode === "popParent") {
        break;
      }
    }

    var spliceArgs = [o + 1, 0];
    for (var i = 0; i < morphs.length; ++i) {
      spliceArgs.push(["createMorph", morphs[i].slice()]);
    }
    opcodes.splice.apply(opcodes, spliceArgs);
    morphs.length = 0;
  }

});
enifed('htmlbars-compiler/template-compiler', ['exports', './fragment-opcode-compiler', './fragment-javascript-compiler', './hydration-opcode-compiler', './hydration-javascript-compiler', './template-visitor', './utils', '../htmlbars-util/quoting', '../htmlbars-util/array-utils'], function (exports, FragmentOpcodeCompiler, FragmentJavaScriptCompiler, HydrationOpcodeCompiler, HydrationJavaScriptCompiler, TemplateVisitor, utils, quoting, array_utils) {

  'use strict';

  function TemplateCompiler(options) {
    this.options = options || {};
    this.consumerBuildMeta = this.options.buildMeta || function () {};
    this.fragmentOpcodeCompiler = new FragmentOpcodeCompiler['default']();
    this.fragmentCompiler = new FragmentJavaScriptCompiler['default']();
    this.hydrationOpcodeCompiler = new HydrationOpcodeCompiler['default']();
    this.hydrationCompiler = new HydrationJavaScriptCompiler['default']();
    this.templates = [];
    this.childTemplates = [];
  }

  exports['default'] = TemplateCompiler;

  var dynamicNodes = {
    mustache: true,
    block: true,
    component: true
  };

  TemplateCompiler.prototype.compile = function (ast) {
    var templateVisitor = new TemplateVisitor['default']();
    templateVisitor.visit(ast);

    var normalizedActions = [];
    var actions = templateVisitor.actions;

    for (var i = 0, l = actions.length - 1; i < l; i++) {
      var action = actions[i];
      var nextAction = actions[i + 1];

      normalizedActions.push(action);

      if (action[0] === 'startProgram' && nextAction[0] in dynamicNodes) {
        normalizedActions.push(['insertBoundary', [true]]);
      }

      if (nextAction[0] === 'endProgram' && action[0] in dynamicNodes) {
        normalizedActions.push(['insertBoundary', [false]]);
      }
    }

    normalizedActions.push(actions[actions.length - 1]);

    utils.processOpcodes(this, normalizedActions);

    return this.templates.pop();
  };

  TemplateCompiler.prototype.startProgram = function (program, childTemplateCount, blankChildTextNodes) {
    this.fragmentOpcodeCompiler.startProgram(program, childTemplateCount, blankChildTextNodes);
    this.hydrationOpcodeCompiler.startProgram(program, childTemplateCount, blankChildTextNodes);

    this.childTemplates.length = 0;
    while (childTemplateCount--) {
      this.childTemplates.push(this.templates.pop());
    }
  };

  TemplateCompiler.prototype.insertBoundary = function (first) {
    this.hydrationOpcodeCompiler.insertBoundary(first);
  };

  TemplateCompiler.prototype.getChildTemplateVars = function (indent) {
    var vars = '';
    if (this.childTemplates) {
      for (var i = 0; i < this.childTemplates.length; i++) {
        vars += indent + 'var child' + i + ' = ' + this.childTemplates[i] + ';\n';
      }
    }
    return vars;
  };

  TemplateCompiler.prototype.getHydrationHooks = function (indent, hooks) {
    var hookVars = [];
    for (var hook in hooks) {
      hookVars.push(hook + ' = hooks.' + hook);
    }

    if (hookVars.length > 0) {
      return indent + 'var hooks = env.hooks, ' + hookVars.join(', ') + ';\n';
    } else {
      return '';
    }
  };

  TemplateCompiler.prototype.endProgram = function (program, programDepth) {
    this.fragmentOpcodeCompiler.endProgram(program);
    this.hydrationOpcodeCompiler.endProgram(program);

    var indent = quoting.repeat('  ', programDepth);
    var options = {
      indent: indent + '    '
    };

    // function build(dom) { return fragment; }
    var fragmentProgram = this.fragmentCompiler.compile(this.fragmentOpcodeCompiler.opcodes, options);

    // function hydrate(fragment) { return mustaches; }
    var hydrationPrograms = this.hydrationCompiler.compile(this.hydrationOpcodeCompiler.opcodes, options);

    var blockParams = program.blockParams || [];

    var templateSignature = 'context, rootNode, env, options';
    if (blockParams.length > 0) {
      templateSignature += ', blockArguments';
    }

    var statements = array_utils.map(hydrationPrograms.statements, function (s) {
      return indent + '      ' + JSON.stringify(s);
    }).join(',\n');

    var locals = JSON.stringify(hydrationPrograms.locals);

    var templates = array_utils.map(this.childTemplates, function (_, index) {
      return 'child' + index;
    }).join(', ');

    var template = '(function() {\n' + this.getChildTemplateVars(indent + '  ') + indent + '  return {\n' + this.buildMeta(indent + '    ', program) + indent + '    arity: ' + blockParams.length + ',\n' + indent + '    cachedFragment: null,\n' + indent + '    hasRendered: false,\n' + indent + '    buildFragment: ' + fragmentProgram + ',\n' + indent + '    buildRenderNodes: ' + hydrationPrograms.createMorphsProgram + ',\n' + indent + '    statements: [\n' + statements + '\n' + indent + '    ],\n' + indent + '    locals: ' + locals + ',\n' + indent + '    templates: [' + templates + ']\n' + indent + '  };\n' + indent + '}())';

    this.templates.push(template);
  };

  TemplateCompiler.prototype.buildMeta = function (indent, program) {
    var meta = this.consumerBuildMeta(program) || {};

    var head = indent + 'meta: ';
    var stringMeta = JSON.stringify(meta, null, 2).replace(/\n/g, '\n' + indent);
    var tail = ',\n';

    return head + stringMeta + tail;
  };

  TemplateCompiler.prototype.openElement = function (element, i, l, r, c, b) {
    this.fragmentOpcodeCompiler.openElement(element, i, l, r, c, b);
    this.hydrationOpcodeCompiler.openElement(element, i, l, r, c, b);
  };

  TemplateCompiler.prototype.closeElement = function (element, i, l, r) {
    this.fragmentOpcodeCompiler.closeElement(element, i, l, r);
    this.hydrationOpcodeCompiler.closeElement(element, i, l, r);
  };

  TemplateCompiler.prototype.component = function (component, i, l, s) {
    this.fragmentOpcodeCompiler.component(component, i, l, s);
    this.hydrationOpcodeCompiler.component(component, i, l, s);
  };

  TemplateCompiler.prototype.block = function (block, i, l, s) {
    this.fragmentOpcodeCompiler.block(block, i, l, s);
    this.hydrationOpcodeCompiler.block(block, i, l, s);
  };

  TemplateCompiler.prototype.text = function (string, i, l, r) {
    this.fragmentOpcodeCompiler.text(string, i, l, r);
    this.hydrationOpcodeCompiler.text(string, i, l, r);
  };

  TemplateCompiler.prototype.comment = function (string, i, l, r) {
    this.fragmentOpcodeCompiler.comment(string, i, l, r);
    this.hydrationOpcodeCompiler.comment(string, i, l, r);
  };

  TemplateCompiler.prototype.mustache = function (mustache, i, l, s) {
    this.fragmentOpcodeCompiler.mustache(mustache, i, l, s);
    this.hydrationOpcodeCompiler.mustache(mustache, i, l, s);
  };

  TemplateCompiler.prototype.setNamespace = function (namespace) {
    this.fragmentOpcodeCompiler.setNamespace(namespace);
  };

});
enifed('htmlbars-compiler/template-visitor', ['exports'], function (exports) {

  'use strict';

  var push = Array.prototype.push;

  function Frame() {
    this.parentNode = null;
    this.children = null;
    this.childIndex = null;
    this.childCount = null;
    this.childTemplateCount = 0;
    this.mustacheCount = 0;
    this.actions = [];
  }

  /**
   * Takes in an AST and outputs a list of actions to be consumed
   * by a compiler. For example, the template
   *
   *     foo{{bar}}<div>baz</div>
   *
   * produces the actions
   *
   *     [['startProgram', [programNode, 0]],
   *      ['text', [textNode, 0, 3]],
   *      ['mustache', [mustacheNode, 1, 3]],
   *      ['openElement', [elementNode, 2, 3, 0]],
   *      ['text', [textNode, 0, 1]],
   *      ['closeElement', [elementNode, 2, 3],
   *      ['endProgram', [programNode]]]
   *
   * This visitor walks the AST depth first and backwards. As
   * a result the bottom-most child template will appear at the
   * top of the actions list whereas the root template will appear
   * at the bottom of the list. For example,
   *
   *     <div>{{#if}}foo{{else}}bar<b></b>{{/if}}</div>
   *
   * produces the actions
   *
   *     [['startProgram', [programNode, 0]],
   *      ['text', [textNode, 0, 2, 0]],
   *      ['openElement', [elementNode, 1, 2, 0]],
   *      ['closeElement', [elementNode, 1, 2]],
   *      ['endProgram', [programNode]],
   *      ['startProgram', [programNode, 0]],
   *      ['text', [textNode, 0, 1]],
   *      ['endProgram', [programNode]],
   *      ['startProgram', [programNode, 2]],
   *      ['openElement', [elementNode, 0, 1, 1]],
   *      ['block', [blockNode, 0, 1]],
   *      ['closeElement', [elementNode, 0, 1]],
   *      ['endProgram', [programNode]]]
   *
   * The state of the traversal is maintained by a stack of frames.
   * Whenever a node with children is entered (either a ProgramNode
   * or an ElementNode) a frame is pushed onto the stack. The frame
   * contains information about the state of the traversal of that
   * node. For example,
   *
   *   - index of the current child node being visited
   *   - the number of mustaches contained within its child nodes
   *   - the list of actions generated by its child nodes
   */

  function TemplateVisitor() {
    this.frameStack = [];
    this.actions = [];
    this.programDepth = -1;
  }

  // Traversal methods

  TemplateVisitor.prototype.visit = function (node) {
    this[node.type](node);
  };

  TemplateVisitor.prototype.Program = function (program) {
    this.programDepth++;

    var parentFrame = this.getCurrentFrame();
    var programFrame = this.pushFrame();

    programFrame.parentNode = program;
    programFrame.children = program.body;
    programFrame.childCount = program.body.length;
    programFrame.blankChildTextNodes = [];
    programFrame.actions.push(['endProgram', [program, this.programDepth]]);

    for (var i = program.body.length - 1; i >= 0; i--) {
      programFrame.childIndex = i;
      this.visit(program.body[i]);
    }

    programFrame.actions.push(['startProgram', [program, programFrame.childTemplateCount, programFrame.blankChildTextNodes.reverse()]]);
    this.popFrame();

    this.programDepth--;

    // Push the completed template into the global actions list
    if (parentFrame) {
      parentFrame.childTemplateCount++;
    }
    push.apply(this.actions, programFrame.actions.reverse());
  };

  TemplateVisitor.prototype.ElementNode = function (element) {
    var parentFrame = this.getCurrentFrame();
    var elementFrame = this.pushFrame();

    elementFrame.parentNode = element;
    elementFrame.children = element.children;
    elementFrame.childCount = element.children.length;
    elementFrame.mustacheCount += element.modifiers.length;
    elementFrame.blankChildTextNodes = [];

    var actionArgs = [element, parentFrame.childIndex, parentFrame.childCount];

    elementFrame.actions.push(['closeElement', actionArgs]);

    for (var i = element.attributes.length - 1; i >= 0; i--) {
      this.visit(element.attributes[i]);
    }

    for (i = element.children.length - 1; i >= 0; i--) {
      elementFrame.childIndex = i;
      this.visit(element.children[i]);
    }

    elementFrame.actions.push(['openElement', actionArgs.concat([elementFrame.mustacheCount, elementFrame.blankChildTextNodes.reverse()])]);
    this.popFrame();

    // Propagate the element's frame state to the parent frame
    if (elementFrame.mustacheCount > 0) {
      parentFrame.mustacheCount++;
    }
    parentFrame.childTemplateCount += elementFrame.childTemplateCount;
    push.apply(parentFrame.actions, elementFrame.actions);
  };

  TemplateVisitor.prototype.AttrNode = function (attr) {
    if (attr.value.type !== 'TextNode') {
      this.getCurrentFrame().mustacheCount++;
    }
  };

  TemplateVisitor.prototype.TextNode = function (text) {
    var frame = this.getCurrentFrame();
    if (text.chars === '') {
      frame.blankChildTextNodes.push(domIndexOf(frame.children, text));
    }
    frame.actions.push(['text', [text, frame.childIndex, frame.childCount]]);
  };

  TemplateVisitor.prototype.BlockStatement = function (node) {
    var frame = this.getCurrentFrame();

    frame.mustacheCount++;
    frame.actions.push(['block', [node, frame.childIndex, frame.childCount]]);

    if (node.inverse) {
      this.visit(node.inverse);
    }
    if (node.program) {
      this.visit(node.program);
    }
  };

  TemplateVisitor.prototype.ComponentNode = function (node) {
    var frame = this.getCurrentFrame();

    frame.mustacheCount++;
    frame.actions.push(['component', [node, frame.childIndex, frame.childCount]]);

    if (node.program) {
      this.visit(node.program);
    }
  };

  TemplateVisitor.prototype.PartialStatement = function (node) {
    var frame = this.getCurrentFrame();
    frame.mustacheCount++;
    frame.actions.push(['mustache', [node, frame.childIndex, frame.childCount]]);
  };

  TemplateVisitor.prototype.CommentStatement = function (text) {
    var frame = this.getCurrentFrame();
    frame.actions.push(['comment', [text, frame.childIndex, frame.childCount]]);
  };

  TemplateVisitor.prototype.MustacheStatement = function (mustache) {
    var frame = this.getCurrentFrame();
    frame.mustacheCount++;
    frame.actions.push(['mustache', [mustache, frame.childIndex, frame.childCount]]);
  };

  // Frame helpers

  TemplateVisitor.prototype.getCurrentFrame = function () {
    return this.frameStack[this.frameStack.length - 1];
  };

  TemplateVisitor.prototype.pushFrame = function () {
    var frame = new Frame();
    this.frameStack.push(frame);
    return frame;
  };

  TemplateVisitor.prototype.popFrame = function () {
    return this.frameStack.pop();
  };

  exports['default'] = TemplateVisitor;

  // Returns the index of `domNode` in the `nodes` array, skipping
  // over any nodes which do not represent DOM nodes.
  function domIndexOf(nodes, domNode) {
    var index = -1;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node.type !== 'TextNode' && node.type !== 'ElementNode') {
        continue;
      } else {
        index++;
      }

      if (node === domNode) {
        return index;
      }
    }

    return -1;
  }

});
enifed('htmlbars-compiler/utils', ['exports'], function (exports) {

  'use strict';

  exports.processOpcodes = processOpcodes;

  function processOpcodes(compiler, opcodes) {
    for (var i = 0, l = opcodes.length; i < l; i++) {
      var method = opcodes[i][0];
      var params = opcodes[i][1];
      if (params) {
        compiler[method].apply(compiler, params);
      } else {
        compiler[method].call(compiler);
      }
    }
  }

});
enifed('htmlbars-runtime', ['exports', './htmlbars-runtime/hooks', './htmlbars-runtime/render', '../htmlbars-util/morph-utils', '../htmlbars-util/template-utils', './htmlbars-runtime/expression-visitor', 'htmlbars-runtime/hooks'], function (exports, hooks, render, morph_utils, template_utils, expression_visitor, htmlbars_runtime__hooks) {

  'use strict';

  var internal = {
    blockFor: template_utils.blockFor,
    manualElement: render.manualElement,
    hostBlock: htmlbars_runtime__hooks.hostBlock,
    continueBlock: htmlbars_runtime__hooks.continueBlock,
    hostYieldWithShadowTemplate: htmlbars_runtime__hooks.hostYieldWithShadowTemplate,
    visitChildren: morph_utils.visitChildren,
    validateChildMorphs: expression_visitor.validateChildMorphs,
    clearMorph: template_utils.clearMorph
  };

  exports.hooks = hooks['default'];
  exports.render = render['default'];
  exports.internal = internal;

});
enifed('htmlbars-runtime/expression-visitor', ['exports', '../htmlbars-util/object-utils', '../htmlbars-util/morph-utils'], function (exports, object_utils, morph_utils) {

  'use strict';

  var base = {
    acceptExpression: function (node, morph, env, scope) {
      var ret = { value: null };

      // Primitive literals are unambiguously non-array representations of
      // themselves.
      if (typeof node !== "object" || node === null) {
        ret.value = node;
        return ret;
      }

      switch (node[0]) {
        // can be used by manualElement
        case "value":
          ret.value = node[1];break;
        case "get":
          ret.value = this.get(node, morph, env, scope);break;
        case "subexpr":
          ret.value = this.subexpr(node, morph, env, scope);break;
        case "concat":
          ret.value = this.concat(node, morph, env, scope);break;
      }

      return ret;
    },

    acceptParamsAndHash: function (env, scope, morph, path, params, hash) {
      params = params && this.acceptParams(params, morph, env, scope);
      hash = hash && this.acceptHash(hash, morph, env, scope);

      morph_utils.linkParams(env, scope, morph, path, params, hash);
      return [params, hash];
    },

    acceptParams: function (nodes, morph, env, scope) {
      if (morph.linkedParams) {
        return morph.linkedParams.params;
      }

      var arr = new Array(nodes.length);

      for (var i = 0, l = nodes.length; i < l; i++) {
        arr[i] = this.acceptExpression(nodes[i], morph, env, scope, null, null).value;
      }

      return arr;
    },

    acceptHash: function (pairs, morph, env, scope) {
      if (morph.linkedParams) {
        return morph.linkedParams.hash;
      }

      var object = {};

      for (var i = 0, l = pairs.length; i < l; i += 2) {
        object[pairs[i]] = this.acceptExpression(pairs[i + 1], morph, env, scope, null, null).value;
      }

      return object;
    },

    // [ 'get', path ]
    get: function (node, morph, env, scope) {
      return env.hooks.get(env, scope, node[1]);
    },

    // [ 'subexpr', path, params, hash ]
    subexpr: function (node, morph, env, scope) {
      var path = node[1],
          params = node[2],
          hash = node[3];
      return env.hooks.subexpr(env, scope, path, this.acceptParams(params, morph, env, scope), this.acceptHash(hash, morph, env, scope));
    },

    // [ 'concat', parts ]
    concat: function (node, morph, env, scope) {
      return env.hooks.concat(env, this.acceptParams(node[1], morph, env, scope));
    }
  };

  var AlwaysDirtyVisitor = object_utils.merge(object_utils.createObject(base), {
    // [ 'block', path, params, hash, templateId, inverseId ]
    block: function (node, morph, env, scope, template, visitor) {
      var path = node[1],
          params = node[2],
          hash = node[3],
          templateId = node[4],
          inverseId = node[5];
      var paramsAndHash = this.acceptParamsAndHash(env, scope, morph, path, params, hash);

      morph.isDirty = morph.isSubtreeDirty = false;
      env.hooks.block(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], templateId === null ? null : template.templates[templateId], inverseId === null ? null : template.templates[inverseId], visitor);
    },

    // [ 'inline', path, params, hash ]
    inline: function (node, morph, env, scope, visitor) {
      var path = node[1],
          params = node[2],
          hash = node[3];
      var paramsAndHash = this.acceptParamsAndHash(env, scope, morph, path, params, hash);

      morph.isDirty = morph.isSubtreeDirty = false;
      env.hooks.inline(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], visitor);
    },

    // [ 'content', path ]
    content: function (node, morph, env, scope, visitor) {
      var path = node[1];

      morph.isDirty = morph.isSubtreeDirty = false;

      if (isHelper(env, scope, path)) {
        env.hooks.inline(morph, env, scope, path, [], {}, visitor);
        return;
      }

      var params;
      if (morph.linkedParams) {
        params = morph.linkedParams.params;
      } else {
        params = [env.hooks.get(env, scope, path)];
      }

      morph_utils.linkParams(env, scope, morph, "@range", params, null);
      env.hooks.range(morph, env, scope, path, params[0], visitor);
    },

    // [ 'element', path, params, hash ]
    element: function (node, morph, env, scope, visitor) {
      var path = node[1],
          params = node[2],
          hash = node[3];
      var paramsAndHash = this.acceptParamsAndHash(env, scope, morph, path, params, hash);

      morph.isDirty = morph.isSubtreeDirty = false;
      env.hooks.element(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], visitor);
    },

    // [ 'attribute', name, value ]
    attribute: function (node, morph, env, scope) {
      var name = node[1],
          value = node[2];
      var paramsAndHash = this.acceptParamsAndHash(env, scope, morph, "@attribute", [value], null);

      morph.isDirty = morph.isSubtreeDirty = false;
      env.hooks.attribute(morph, env, scope, name, paramsAndHash[0][0]);
    },

    // [ 'component', path, attrs, templateId, inverseId ]
    component: function (node, morph, env, scope, template, visitor) {
      var path = node[1],
          attrs = node[2],
          templateId = node[3],
          inverseId = node[4];
      var paramsAndHash = this.acceptParamsAndHash(env, scope, morph, path, [], attrs);
      var templates = {
        "default": template.templates[templateId],
        inverse: template.templates[inverseId]
      };

      morph.isDirty = morph.isSubtreeDirty = false;
      env.hooks.component(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], templates, visitor);
    }
  });

  exports['default'] = object_utils.merge(object_utils.createObject(base), {
    // [ 'block', path, params, hash, templateId, inverseId ]
    block: function (node, morph, env, scope, template, visitor) {
      dirtyCheck(env, morph, visitor, function (visitor) {
        AlwaysDirtyVisitor.block(node, morph, env, scope, template, visitor);
      });
    },

    // [ 'inline', path, params, hash ]
    inline: function (node, morph, env, scope, visitor) {
      dirtyCheck(env, morph, visitor, function (visitor) {
        AlwaysDirtyVisitor.inline(node, morph, env, scope, visitor);
      });
    },

    // [ 'content', path ]
    content: function (node, morph, env, scope, visitor) {
      dirtyCheck(env, morph, visitor, function (visitor) {
        AlwaysDirtyVisitor.content(node, morph, env, scope, visitor);
      });
    },

    // [ 'element', path, params, hash ]
    element: function (node, morph, env, scope, template, visitor) {
      dirtyCheck(env, morph, visitor, function (visitor) {
        AlwaysDirtyVisitor.element(node, morph, env, scope, template, visitor);
      });
    },

    // [ 'attribute', name, value ]
    attribute: function (node, morph, env, scope, template) {
      dirtyCheck(env, morph, null, function () {
        AlwaysDirtyVisitor.attribute(node, morph, env, scope, template);
      });
    },

    // [ 'component', path, attrs, templateId ]
    component: function (node, morph, env, scope, template, visitor) {
      dirtyCheck(env, morph, visitor, function (visitor) {
        AlwaysDirtyVisitor.component(node, morph, env, scope, template, visitor);
      });
    } });

  function dirtyCheck(env, morph, visitor, callback) {
    var isDirty = morph.isDirty;
    var isSubtreeDirty = morph.isSubtreeDirty;

    if (isSubtreeDirty) {
      visitor = AlwaysDirtyVisitor;
    }

    if (isDirty || isSubtreeDirty) {
      callback(visitor);
    } else {
      if (morph.lastEnv) {
        env = object_utils.merge(object_utils.shallowCopy(morph.lastEnv), env);
      }
      morph_utils.validateChildMorphs(env, morph, visitor);
    }
  }

  function isHelper(env, scope, path) {
    return env.hooks.keywords[path] !== undefined || env.hooks.hasHelper(env, scope, path);
  }

  exports.AlwaysDirtyVisitor = AlwaysDirtyVisitor;

});
enifed('htmlbars-runtime/hooks', ['exports', './render', '../morph-range/morph-list', '../htmlbars-util/object-utils', '../htmlbars-util/morph-utils', '../htmlbars-util/template-utils'], function (exports, render, MorphList, object_utils, morph_utils, template_utils) {

  'use strict';

  exports.wrap = wrap;
  exports.wrapForHelper = wrapForHelper;
  exports.hostYieldWithShadowTemplate = hostYieldWithShadowTemplate;
  exports.createScope = createScope;
  exports.createFreshScope = createFreshScope;
  exports.bindShadowScope = bindShadowScope;
  exports.createChildScope = createChildScope;
  exports.bindSelf = bindSelf;
  exports.updateSelf = updateSelf;
  exports.bindLocal = bindLocal;
  exports.updateLocal = updateLocal;
  exports.bindBlock = bindBlock;
  exports.block = block;
  exports.continueBlock = continueBlock;
  exports.hostBlock = hostBlock;
  exports.handleRedirect = handleRedirect;
  exports.handleKeyword = handleKeyword;
  exports.linkRenderNode = linkRenderNode;
  exports.inline = inline;
  exports.keyword = keyword;
  exports.invokeHelper = invokeHelper;
  exports.classify = classify;
  exports.partial = partial;
  exports.range = range;
  exports.element = element;
  exports.attribute = attribute;
  exports.subexpr = subexpr;
  exports.get = get;
  exports.getRoot = getRoot;
  exports.getChild = getChild;
  exports.getValue = getValue;
  exports.getCellOrValue = getCellOrValue;
  exports.component = component;
  exports.concat = concat;
  exports.hasHelper = hasHelper;
  exports.lookupHelper = lookupHelper;
  exports.bindScope = bindScope;
  exports.updateScope = updateScope;

  /**
    HTMLBars delegates the runtime behavior of a template to
    hooks provided by the host environment. These hooks explain
    the lexical environment of a Handlebars template, the internal
    representation of references, and the interaction between an
    HTMLBars template and the DOM it is managing.

    While HTMLBars host hooks have access to all of this internal
    machinery, templates and helpers have access to the abstraction
    provided by the host hooks.

    ## The Lexical Environment

    The default lexical environment of an HTMLBars template includes:

    * Any local variables, provided by *block arguments*
    * The current value of `self`

    ## Simple Nesting

    Let's look at a simple template with a nested block:

    ```hbs
    <h1>{{title}}</h1>

    {{#if author}}
      <p class="byline">{{author}}</p>
    {{/if}}
    ```

    In this case, the lexical environment at the top-level of the
    template does not change inside of the `if` block. This is
    achieved via an implementation of `if` that looks like this:

    ```js
    registerHelper('if', function(params) {
      if (!!params[0]) {
        return this.yield();
      }
    });
    ```

    A call to `this.yield` invokes the child template using the
    current lexical environment.

    ## Block Arguments

    It is possible for nested blocks to introduce new local
    variables:

    ```hbs
    {{#count-calls as |i|}}
    <h1>{{title}}</h1>
    <p>Called {{i}} times</p>
    {{/count}}
    ```

    In this example, the child block inherits its surrounding
    lexical environment, but augments it with a single new
    variable binding.

    The implementation of `count-calls` supplies the value of
    `i`, but does not otherwise alter the environment:

    ```js
    var count = 0;
    registerHelper('count-calls', function() {
      return this.yield([ ++count ]);
    });
    ```
  */

  function wrap(template) {
    if (template === null) {
      return null;
    }

    return {
      meta: template.meta,
      arity: template.arity,
      raw: template,
      render: function (self, env, options, blockArguments) {
        var scope = env.hooks.createFreshScope();

        options = options || {};
        options.self = self;
        options.blockArguments = blockArguments;

        return render['default'](template, env, scope, options);
      }
    };
  }

  function wrapForHelper(template, env, scope, morph, renderState, visitor) {
    if (!template) {
      return {
        yieldIn: yieldInShadowTemplate(null, env, scope, morph, renderState, visitor)
      };
    }

    var yieldArgs = yieldTemplate(template, env, scope, morph, renderState, visitor);

    return {
      meta: template.meta,
      arity: template.arity,
      yield: yieldArgs,
      yieldItem: yieldItem(template, env, scope, morph, renderState, visitor),
      yieldIn: yieldInShadowTemplate(template, env, scope, morph, renderState, visitor),
      raw: template,

      render: function (self, blockArguments) {
        yieldArgs(blockArguments, self);
      }
    };
  }

  function yieldTemplate(template, env, parentScope, morph, renderState, visitor) {
    return function (blockArguments, self) {
      renderState.clearMorph = null;

      if (morph.morphList) {
        renderState.morphList = morph.morphList.firstChildMorph;
        renderState.morphList = null;
      }

      var scope = parentScope;

      if (morph.lastYielded && isStableTemplate(template, morph.lastYielded)) {
        return morph.lastResult.revalidateWith(env, undefined, self, blockArguments, visitor);
      }

      // Check to make sure that we actually **need** a new scope, and can't
      // share the parent scope. Note that we need to move this check into
      // a host hook, because the host's notion of scope may require a new
      // scope in more cases than the ones we can determine statically.
      if (self !== undefined || parentScope === null || template.arity) {
        scope = env.hooks.createChildScope(parentScope);
      }

      morph.lastYielded = { self: self, template: template, shadowTemplate: null };

      // Render the template that was selected by the helper
      render['default'](template, env, scope, { renderNode: morph, self: self, blockArguments: blockArguments });
    };
  }

  function yieldItem(template, env, parentScope, morph, renderState, visitor) {
    var currentMorph = null;
    var morphList = morph.morphList;
    if (morphList) {
      currentMorph = morphList.firstChildMorph;
      renderState.morphListStart = currentMorph;
    }

    return function (key, blockArguments, self) {
      if (typeof key !== "string") {
        throw new Error("You must provide a string key when calling `yieldItem`; you provided " + key);
      }

      var morphList, morphMap;

      if (!morph.morphList) {
        morph.morphList = new MorphList['default']();
        morph.morphMap = {};
        morph.setMorphList(morph.morphList);
      }

      morphList = morph.morphList;
      morphMap = morph.morphMap;

      if (currentMorph && currentMorph.key === key) {
        yieldTemplate(template, env, parentScope, currentMorph, renderState, visitor)(blockArguments, self);
        currentMorph = currentMorph.nextMorph;
      } else if (currentMorph && morphMap[key] !== undefined) {
        var foundMorph = morphMap[key];
        yieldTemplate(template, env, parentScope, foundMorph, renderState, visitor)(blockArguments, self);
        morphList.insertBeforeMorph(foundMorph, currentMorph);
      } else {
        var childMorph = render.createChildMorph(env.dom, morph);
        childMorph.key = key;
        morphMap[key] = childMorph;
        morphList.insertBeforeMorph(childMorph, currentMorph);
        yieldTemplate(template, env, parentScope, childMorph, renderState, visitor)(blockArguments, self);
      }

      renderState.morphListStart = currentMorph;
      renderState.clearMorph = morph.childNodes;
      morph.childNodes = null;
    };
  }

  function isStableTemplate(template, lastYielded) {
    return !lastYielded.shadowTemplate && template === lastYielded.template;
  }

  function yieldInShadowTemplate(template, env, parentScope, morph, renderState, visitor) {
    var hostYield = hostYieldWithShadowTemplate(template, env, parentScope, morph, renderState, visitor);

    return function (shadowTemplate, self) {
      hostYield(shadowTemplate, env, self, []);
    };
  }
  function hostYieldWithShadowTemplate(template, env, parentScope, morph, renderState, visitor) {
    return function (shadowTemplate, env, self, blockArguments) {
      renderState.clearMorph = null;

      if (morph.lastYielded && isStableShadowRoot(template, shadowTemplate, morph.lastYielded)) {
        return morph.lastResult.revalidateWith(env, undefined, self, blockArguments, visitor);
      }

      var shadowScope = env.hooks.createFreshScope();
      env.hooks.bindShadowScope(env, parentScope, shadowScope, renderState.shadowOptions);
      blockToYield.arity = template.arity;
      env.hooks.bindBlock(env, shadowScope, blockToYield);

      morph.lastYielded = { self: self, template: template, shadowTemplate: shadowTemplate };

      // Render the shadow template with the block available
      render['default'](shadowTemplate.raw, env, shadowScope, { renderNode: morph, self: self, blockArguments: blockArguments });
    };

    function blockToYield(env, blockArguments, self, renderNode, shadowParent, visitor) {
      if (renderNode.lastResult) {
        renderNode.lastResult.revalidateWith(env, undefined, undefined, blockArguments, visitor);
      } else {
        var scope = parentScope;

        // Since a yielded template shares a `self` with its original context,
        // we only need to create a new scope if the template has block parameters
        if (template.arity) {
          scope = env.hooks.createChildScope(parentScope);
        }

        render['default'](template, env, scope, { renderNode: renderNode, self: self, blockArguments: blockArguments });
      }
    }
  }

  function isStableShadowRoot(template, shadowTemplate, lastYielded) {
    return template === lastYielded.template && shadowTemplate === lastYielded.shadowTemplate;
  }

  function optionsFor(template, inverse, env, scope, morph, visitor) {
    var renderState = { morphListStart: null, clearMorph: morph, shadowOptions: null };

    return {
      templates: {
        template: wrapForHelper(template, env, scope, morph, renderState, visitor),
        inverse: wrapForHelper(inverse, env, scope, morph, renderState, visitor)
      },
      renderState: renderState
    };
  }

  function thisFor(options) {
    return {
      arity: options.template.arity,
      yield: options.template.yield,
      yieldItem: options.template.yieldItem,
      yieldIn: options.template.yieldIn
    };
  }
  function createScope(env, parentScope) {
    if (parentScope) {
      return env.hooks.createChildScope(parentScope);
    } else {
      return env.hooks.createFreshScope();
    }
  }

  function createFreshScope() {
    // because `in` checks have unpredictable performance, keep a
    // separate dictionary to track whether a local was bound.
    // See `bindLocal` for more information.
    return { self: null, blocks: {}, locals: {}, localPresent: {} };
  }

  function bindShadowScope(env /*, parentScope, shadowScope */) {
    return env.hooks.createFreshScope();
  }

  function createChildScope(parent) {
    var scope = object_utils.createObject(parent);
    scope.locals = object_utils.createObject(parent.locals);
    return scope;
  }

  function bindSelf(env, scope, self) {
    scope.self = self;
  }

  function updateSelf(env, scope, self) {
    env.hooks.bindSelf(env, scope, self);
  }

  function bindLocal(env, scope, name, value) {
    scope.localPresent[name] = true;
    scope.locals[name] = value;
  }

  function updateLocal(env, scope, name, value) {
    env.hooks.bindLocal(env, scope, name, value);
  }

  function bindBlock(env, scope, block) {
    var name = arguments[3] === undefined ? "default" : arguments[3];

    scope.blocks[name] = block;
  }

  function block(morph, env, scope, path, params, hash, template, inverse, visitor) {
    if (handleRedirect(morph, env, scope, path, params, hash, template, inverse, visitor)) {
      return;
    }

    continueBlock(morph, env, scope, path, params, hash, template, inverse, visitor);
  }

  function continueBlock(morph, env, scope, path, params, hash, template, inverse, visitor) {
    hostBlock(morph, env, scope, template, inverse, null, visitor, function (options) {
      var helper = env.hooks.lookupHelper(env, scope, path);
      return env.hooks.invokeHelper(morph, env, scope, visitor, params, hash, helper, options.templates, thisFor(options.templates));
    });
  }

  function hostBlock(morph, env, scope, template, inverse, shadowOptions, visitor, callback) {
    var options = optionsFor(template, inverse, env, scope, morph, visitor);
    template_utils.renderAndCleanup(morph, env, options, shadowOptions, callback);
  }

  function handleRedirect(morph, env, scope, path, params, hash, template, inverse, visitor) {
    var redirect = env.hooks.classify(env, scope, path);
    if (redirect) {
      switch (redirect) {
        case "component":
          env.hooks.component(morph, env, scope, path, params, hash, { "default": template, inverse: inverse }, visitor);break;
        case "inline":
          env.hooks.inline(morph, env, scope, path, params, hash, visitor);break;
        case "block":
          env.hooks.block(morph, env, scope, path, params, hash, template, inverse, visitor);break;
        default:
          throw new Error("Internal HTMLBars redirection to " + redirect + " not supported");
      }
      return true;
    }

    if (handleKeyword(path, morph, env, scope, params, hash, template, inverse, visitor)) {
      return true;
    }

    return false;
  }

  function handleKeyword(path, morph, env, scope, params, hash, template, inverse, visitor) {
    var keyword = env.hooks.keywords[path];
    if (!keyword) {
      return false;
    }

    if (typeof keyword === "function") {
      return keyword(morph, env, scope, params, hash, template, inverse, visitor);
    }

    if (keyword.willRender) {
      keyword.willRender(morph, env);
    }

    var lastState, newState;
    if (keyword.setupState) {
      lastState = object_utils.shallowCopy(morph.state);
      newState = morph.state = keyword.setupState(lastState, env, scope, params, hash);
    }

    if (keyword.childEnv) {
      morph.lastEnv = keyword.childEnv(morph.state);
      env = object_utils.merge(object_utils.shallowCopy(morph.lastEnv), env);
    }

    var firstTime = !morph.rendered;

    if (keyword.isEmpty) {
      var isEmpty = keyword.isEmpty(morph.state, env, scope, params, hash);

      if (isEmpty) {
        if (!firstTime) {
          template_utils.clearMorph(morph, env, false);
        }
        return true;
      }
    }

    if (firstTime) {
      if (keyword.render) {
        keyword.render(morph, env, scope, params, hash, template, inverse, visitor);
      }
      morph.rendered = true;
      return true;
    }

    var isStable;
    if (keyword.isStable) {
      isStable = keyword.isStable(lastState, newState);
    } else {
      isStable = stableState(lastState, newState);
    }

    if (isStable) {
      if (keyword.rerender) {
        var newEnv = keyword.rerender(morph, env, scope, params, hash, template, inverse, visitor);
        env = newEnv || env;
      }
      morph_utils.validateChildMorphs(env, morph, visitor);
      return true;
    } else {
      template_utils.clearMorph(morph, env, false);
    }

    // If the node is unstable, re-render from scratch
    if (keyword.render) {
      keyword.render(morph, env, scope, params, hash, template, inverse, visitor);
      morph.rendered = true;
      return true;
    }
  }

  function stableState(oldState, newState) {
    if (object_utils.keyLength(oldState) !== object_utils.keyLength(newState)) {
      return false;
    }

    for (var prop in oldState) {
      if (oldState[prop] !== newState[prop]) {
        return false;
      }
    }

    return true;
  }
  function linkRenderNode() {
    return;
  }

  function inline(morph, env, scope, path, params, hash, visitor) {
    if (handleRedirect(morph, env, scope, path, params, hash, null, null, visitor)) {
      return;
    }

    var options = optionsFor(null, null, env, scope, morph);

    var helper = env.hooks.lookupHelper(env, scope, path);
    var result = env.hooks.invokeHelper(morph, env, scope, visitor, params, hash, helper, options.templates, thisFor(options.templates));

    if (result && result.value) {
      var value = result.value;
      if (morph.lastValue !== value) {
        morph.setContent(value);
      }
      morph.lastValue = value;
    }
  }

  function keyword(path, morph, env, scope, params, hash, template, inverse, visitor) {
    handleKeyword(path, morph, env, scope, params, hash, template, inverse, visitor);
  }

  function invokeHelper(morph, env, scope, visitor, _params, _hash, helper, templates, context) {
    var params = normalizeArray(env, _params);
    var hash = normalizeObject(env, _hash);
    return { value: helper.call(context, params, hash, templates) };
  }

  function normalizeArray(env, array) {
    var out = new Array(array.length);

    for (var i = 0, l = array.length; i < l; i++) {
      out[i] = env.hooks.getCellOrValue(array[i]);
    }

    return out;
  }

  function normalizeObject(env, object) {
    var out = {};

    for (var prop in object) {
      out[prop] = env.hooks.getCellOrValue(object[prop]);
    }

    return out;
  }
  function classify() {
    return null;
  }

  var keywords = {
    partial: function (morph, env, scope, params) {
      var value = env.hooks.partial(morph, env, scope, params[0]);
      morph.setContent(value);
      return true;
    },

    yield: function (morph, env, scope, params, hash, template, inverse, visitor) {
      // the current scope is provided purely for the creation of shadow
      // scopes; it should not be provided to user code.

      var to = env.hooks.getValue(hash.to) || "default";
      if (scope.blocks[to]) {
        scope.blocks[to](env, params, hash.self, morph, scope, visitor);
      }
      return true;
    },

    hasBlock: function (morph, env, scope, params) {
      var name = env.hooks.getValue(params[0]) || "default";
      return !!scope.blocks[name];
    },

    hasBlockParams: function (morph, env, scope, params) {
      var name = env.hooks.getValue(params[0]) || "default";
      return !!(scope.blocks[name] && scope.blocks[name].arity);
    }

  };function partial(renderNode, env, scope, path) {
    var template = env.partials[path];
    return template.render(scope.self, env, {}).fragment;
  }

  function range(morph, env, scope, path, value, visitor) {
    if (handleRedirect(morph, env, scope, path, [value], {}, null, null, visitor)) {
      return;
    }

    value = env.hooks.getValue(value);

    if (morph.lastValue !== value) {
      morph.setContent(value);
    }

    morph.lastValue = value;
  }

  function element(morph, env, scope, path, params, hash, visitor) {
    if (handleRedirect(morph, env, scope, path, params, hash, null, null, visitor)) {
      return;
    }

    var helper = env.hooks.lookupHelper(env, scope, path);
    if (helper) {
      env.hooks.invokeHelper(null, env, scope, null, params, hash, helper, { element: morph.element });
    }
  }

  function attribute(morph, env, scope, name, value) {
    value = env.hooks.getValue(value);

    if (morph.lastValue !== value) {
      morph.setContent(value);
    }

    morph.lastValue = value;
  }

  function subexpr(env, scope, helperName, params, hash) {
    var helper = env.hooks.lookupHelper(env, scope, helperName);
    var result = env.hooks.invokeHelper(null, env, scope, null, params, hash, helper, {});
    if (result && result.value) {
      return result.value;
    }
  }

  function get(env, scope, path) {
    if (path === "") {
      return scope.self;
    }

    var keys = path.split(".");
    var value = env.hooks.getRoot(scope, keys[0])[0];

    for (var i = 1; i < keys.length; i++) {
      if (value) {
        value = env.hooks.getChild(value, keys[i]);
      } else {
        break;
      }
    }

    return value;
  }

  function getRoot(scope, key) {
    if (scope.localPresent[key]) {
      return [scope.locals[key]];
    } else if (scope.self) {
      return [scope.self[key]];
    } else {
      return [undefined];
    }
  }

  function getChild(value, key) {
    return value[key];
  }

  function getValue(reference) {
    return reference;
  }

  function getCellOrValue(reference) {
    return reference;
  }

  function component(morph, env, scope, tagName, params, attrs, templates, visitor) {
    if (env.hooks.hasHelper(env, scope, tagName)) {
      return env.hooks.block(morph, env, scope, tagName, params, attrs, templates["default"], templates.inverse, visitor);
    }

    componentFallback(morph, env, scope, tagName, attrs, templates["default"]);
  }

  function concat(env, params) {
    var value = "";
    for (var i = 0, l = params.length; i < l; i++) {
      value += env.hooks.getValue(params[i]);
    }
    return value;
  }

  function componentFallback(morph, env, scope, tagName, attrs, template) {
    var element = env.dom.createElement(tagName);
    for (var name in attrs) {
      element.setAttribute(name, env.hooks.getValue(attrs[name]));
    }
    var fragment = render['default'](template, env, scope, {}).fragment;
    element.appendChild(fragment);
    morph.setNode(element);
  }
  function hasHelper(env, scope, helperName) {
    return env.helpers[helperName] !== undefined;
  }

  function lookupHelper(env, scope, helperName) {
    return env.helpers[helperName];
  }

  function bindScope() {}

  function updateScope(env, scope) {
    env.hooks.bindScope(env, scope);
  }

  exports['default'] = {
    // fundamental hooks that you will likely want to override
    bindLocal: bindLocal,
    bindSelf: bindSelf,
    bindScope: bindScope,
    classify: classify,
    component: component,
    concat: concat,
    createFreshScope: createFreshScope,
    getChild: getChild,
    getRoot: getRoot,
    getValue: getValue,
    getCellOrValue: getCellOrValue,
    keywords: keywords,
    linkRenderNode: linkRenderNode,
    partial: partial,
    subexpr: subexpr,

    // fundamental hooks with good default behavior
    bindBlock: bindBlock,
    bindShadowScope: bindShadowScope,
    updateLocal: updateLocal,
    updateSelf: updateSelf,
    updateScope: updateScope,
    createChildScope: createChildScope,
    hasHelper: hasHelper,
    lookupHelper: lookupHelper,
    invokeHelper: invokeHelper,
    cleanupRenderNode: null,
    destroyRenderNode: null,
    willCleanupTree: null,
    didCleanupTree: null,
    willRenderNode: null,
    didRenderNode: null,

    // derived hooks
    attribute: attribute,
    block: block,
    createScope: createScope,
    element: element,
    get: get,
    inline: inline,
    range: range,
    keyword: keyword
  };
  /* morph, env, scope, params, hash */ /* env, scope, path */ /* env, scope */
  // this function is used to handle host-specified extensions to scope
  // other than `self`, `locals` and `block`.

  exports.keywords = keywords;

});
enifed('htmlbars-runtime/morph', ['exports', '../morph-range', '../htmlbars-util/object-utils'], function (exports, MorphBase, object_utils) {

  'use strict';

  var guid = 1;

  function HTMLBarsMorph(domHelper, contextualElement) {
    this.super$constructor(domHelper, contextualElement);

    this.state = {};
    this.ownerNode = null;
    this.isDirty = false;
    this.isSubtreeDirty = false;
    this.lastYielded = null;
    this.lastResult = null;
    this.lastValue = null;
    this.lastEnv = null;
    this.morphList = null;
    this.morphMap = null;
    this.key = null;
    this.linkedParams = null;
    this.rendered = false;
    this.guid = "range" + guid++;
  }

  HTMLBarsMorph.empty = function (domHelper, contextualElement) {
    var morph = new HTMLBarsMorph(domHelper, contextualElement);
    morph.clear();
    return morph;
  };

  HTMLBarsMorph.create = function (domHelper, contextualElement, node) {
    var morph = new HTMLBarsMorph(domHelper, contextualElement);
    morph.setNode(node);
    return morph;
  };

  HTMLBarsMorph.attach = function (domHelper, contextualElement, firstNode, lastNode) {
    var morph = new HTMLBarsMorph(domHelper, contextualElement);
    morph.setRange(firstNode, lastNode);
    return morph;
  };

  var prototype = HTMLBarsMorph.prototype = object_utils.createObject(MorphBase['default'].prototype);
  prototype.constructor = HTMLBarsMorph;
  prototype.super$constructor = MorphBase['default'];

  exports['default'] = HTMLBarsMorph;

});
enifed('htmlbars-runtime/render', ['exports', '../htmlbars-util/array-utils', '../htmlbars-util/morph-utils', './expression-visitor', './morph', '../htmlbars-util/template-utils'], function (exports, array_utils, morph_utils, ExpressionVisitor, Morph, template_utils) {

  'use strict';

  exports.manualElement = manualElement;
  exports.createChildMorph = createChildMorph;
  exports.getCachedFragment = getCachedFragment;

  exports['default'] = render;

  var svgNamespace = "http://www.w3.org/2000/svg";
  function render(template, env, scope, options) {
    var dom = env.dom;
    var contextualElement;

    if (options) {
      if (options.renderNode) {
        contextualElement = options.renderNode.contextualElement;
      } else if (options.contextualElement) {
        contextualElement = options.contextualElement;
      }
    }

    dom.detectNamespace(contextualElement);

    var renderResult = RenderResult.build(env, scope, template, options, contextualElement);
    renderResult.render();

    return renderResult;
  }

  function RenderResult(env, scope, options, rootNode, nodes, fragment, template, shouldSetContent) {
    this.root = rootNode;
    this.fragment = fragment;

    this.nodes = nodes;
    this.template = template;
    this.env = env;
    this.scope = scope;
    this.shouldSetContent = shouldSetContent;

    this.bindScope();

    if (options.self !== undefined) {
      this.bindSelf(options.self);
    }
    if (options.blockArguments !== undefined) {
      this.bindLocals(options.blockArguments);
    }
  }

  RenderResult.build = function (env, scope, template, options, contextualElement) {
    var dom = env.dom;
    var fragment = getCachedFragment(template, env);
    var nodes = template.buildRenderNodes(dom, fragment, contextualElement);

    var rootNode, ownerNode, shouldSetContent;

    if (options && options.renderNode) {
      rootNode = options.renderNode;
      ownerNode = rootNode.ownerNode;
      shouldSetContent = true;
    } else {
      rootNode = dom.createMorph(null, fragment.firstChild, fragment.lastChild, contextualElement);
      ownerNode = rootNode;
      initializeNode(rootNode, ownerNode);
      shouldSetContent = false;
    }

    if (rootNode.childNodes) {
      morph_utils.visitChildren(rootNode.childNodes, function (node) {
        template_utils.clearMorph(node, env, true);
      });
    }

    rootNode.childNodes = nodes;

    array_utils.forEach(nodes, function (node) {
      initializeNode(node, ownerNode);
    });

    return new RenderResult(env, scope, options, rootNode, nodes, fragment, template, shouldSetContent);
  };
  function manualElement(tagName, attributes) {
    var statements = [];

    for (var key in attributes) {
      if (typeof attributes[key] === "string") {
        continue;
      }
      statements.push(["attribute", key, attributes[key]]);
    }

    statements.push(["content", "yield"]);

    var template = {
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        if (tagName === "svg") {
          dom.setNamespace(svgNamespace);
        }
        var el1 = dom.createElement(tagName);

        for (var key in attributes) {
          if (typeof attributes[key] !== "string") {
            continue;
          }
          dom.setAttribute(el1, key, attributes[key]);
        }

        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment) {
        var element = dom.childAt(fragment, [0]);
        var morphs = [];

        for (var key in attributes) {
          if (typeof attributes[key] === "string") {
            continue;
          }
          morphs.push(dom.createAttrMorph(element, key));
        }

        morphs.push(dom.createMorphAt(element, 0, 0));
        return morphs;
      },
      statements: statements,
      locals: [],
      templates: []
    };

    return template;
  }

  RenderResult.prototype.render = function () {
    this.root.lastResult = this;
    this.root.rendered = true;
    this.populateNodes(ExpressionVisitor.AlwaysDirtyVisitor);

    if (this.shouldSetContent) {
      this.root.setContent(this.fragment);
    }
  };

  RenderResult.prototype.dirty = function () {
    morph_utils.visitChildren([this.root], function (node) {
      node.isDirty = true;
    });
  };

  RenderResult.prototype.revalidate = function (env, self, blockArguments, scope) {
    this.revalidateWith(env, scope, self, blockArguments, ExpressionVisitor['default']);
  };

  RenderResult.prototype.rerender = function (env, self, blockArguments, scope) {
    this.revalidateWith(env, scope, self, blockArguments, ExpressionVisitor.AlwaysDirtyVisitor);
  };

  RenderResult.prototype.revalidateWith = function (env, scope, self, blockArguments, visitor) {
    if (env !== undefined) {
      this.env = env;
    }
    if (scope !== undefined) {
      this.scope = scope;
    }
    this.updateScope();

    if (self !== undefined) {
      this.updateSelf(self);
    }
    if (blockArguments !== undefined) {
      this.updateLocals(blockArguments);
    }

    this.populateNodes(visitor);
  };

  RenderResult.prototype.destroy = function () {
    var rootNode = this.root;
    template_utils.clearMorph(rootNode, this.env, true);
  };

  RenderResult.prototype.populateNodes = function (visitor) {
    var env = this.env;
    var scope = this.scope;
    var template = this.template;
    var nodes = this.nodes;
    var statements = template.statements;
    var i, l;

    for (i = 0, l = statements.length; i < l; i++) {
      var statement = statements[i];
      var morph = nodes[i];

      if (env.hooks.willRenderNode) {
        env.hooks.willRenderNode(morph, env, scope);
      }

      switch (statement[0]) {
        case "block":
          visitor.block(statement, morph, env, scope, template, visitor);break;
        case "inline":
          visitor.inline(statement, morph, env, scope, visitor);break;
        case "content":
          visitor.content(statement, morph, env, scope, visitor);break;
        case "element":
          visitor.element(statement, morph, env, scope, template, visitor);break;
        case "attribute":
          visitor.attribute(statement, morph, env, scope);break;
        case "component":
          visitor.component(statement, morph, env, scope, template, visitor);break;
      }

      if (env.hooks.didRenderNode) {
        env.hooks.didRenderNode(morph, env, scope);
      }
    }
  };

  RenderResult.prototype.bindScope = function () {
    this.env.hooks.bindScope(this.env, this.scope);
  };

  RenderResult.prototype.updateScope = function () {
    this.env.hooks.updateScope(this.env, this.scope);
  };

  RenderResult.prototype.bindSelf = function (self) {
    this.env.hooks.bindSelf(this.env, this.scope, self);
  };

  RenderResult.prototype.updateSelf = function (self) {
    this.env.hooks.updateSelf(this.env, this.scope, self);
  };

  RenderResult.prototype.bindLocals = function (blockArguments) {
    var localNames = this.template.locals;

    for (var i = 0, l = localNames.length; i < l; i++) {
      this.env.hooks.bindLocal(this.env, this.scope, localNames[i], blockArguments[i]);
    }
  };

  RenderResult.prototype.updateLocals = function (blockArguments) {
    var localNames = this.template.locals;

    for (var i = 0, l = localNames.length; i < l; i++) {
      this.env.hooks.updateLocal(this.env, this.scope, localNames[i], blockArguments[i]);
    }
  };

  function initializeNode(node, owner) {
    node.ownerNode = owner;
  }
  function createChildMorph(dom, parentMorph, contextualElement) {
    var morph = Morph['default'].empty(dom, contextualElement || parentMorph.contextualElement);
    initializeNode(morph, parentMorph.ownerNode);
    return morph;
  }

  function getCachedFragment(template, env) {
    var dom = env.dom,
        fragment;
    if (env.useFragmentCache && dom.canClone) {
      if (template.cachedFragment === null) {
        fragment = template.buildFragment(dom);
        if (template.hasRendered) {
          template.cachedFragment = fragment;
        } else {
          template.hasRendered = true;
        }
      }
      if (template.cachedFragment) {
        fragment = dom.cloneNode(template.cachedFragment, true);
      }
    } else if (!fragment) {
      fragment = template.buildFragment(dom);
    }

    return fragment;
  }

});
enifed('htmlbars-syntax', ['exports', './htmlbars-syntax/walker', './htmlbars-syntax/builders', './htmlbars-syntax/parser'], function (exports, Walker, builders, parse) {

  'use strict';



  exports.Walker = Walker['default'];
  exports.builders = builders['default'];
  exports.parse = parse['default'];

});
enifed('htmlbars-syntax/builders', ['exports'], function (exports) {

  'use strict';

  exports.buildMustache = buildMustache;
  exports.buildBlock = buildBlock;
  exports.buildElementModifier = buildElementModifier;
  exports.buildPartial = buildPartial;
  exports.buildComment = buildComment;
  exports.buildConcat = buildConcat;
  exports.buildElement = buildElement;
  exports.buildComponent = buildComponent;
  exports.buildAttr = buildAttr;
  exports.buildText = buildText;
  exports.buildSexpr = buildSexpr;
  exports.buildPath = buildPath;
  exports.buildString = buildString;
  exports.buildBoolean = buildBoolean;
  exports.buildNumber = buildNumber;
  exports.buildNull = buildNull;
  exports.buildUndefined = buildUndefined;
  exports.buildHash = buildHash;
  exports.buildPair = buildPair;
  exports.buildProgram = buildProgram;

  // Statements

  function buildMustache(path, params, hash, raw) {
    return {
      type: "MustacheStatement",
      path: path,
      params: params || [],
      hash: hash || buildHash([]),
      escaped: !raw
    };
  }

  function buildBlock(path, params, hash, program, inverse) {
    return {
      type: "BlockStatement",
      path: path,
      params: params || [],
      hash: hash || buildHash([]),
      program: program || null,
      inverse: inverse || null
    };
  }

  function buildElementModifier(path, params, hash) {
    return {
      type: "ElementModifierStatement",
      path: path,
      params: params || [],
      hash: hash || buildHash([])
    };
  }

  function buildPartial(name, params, hash, indent) {
    return {
      type: "PartialStatement",
      name: name,
      params: params || [],
      hash: hash || buildHash([]),
      indent: indent
    };
  }

  function buildComment(value) {
    return {
      type: "CommentStatement",
      value: value
    };
  }

  function buildConcat(parts) {
    return {
      type: "ConcatStatement",
      parts: parts || []
    };
  }

  function buildElement(tag, attributes, modifiers, children) {
    return {
      type: "ElementNode",
      tag: tag,
      attributes: attributes || [],
      modifiers: modifiers || [],
      children: children || []
    };
  }

  function buildComponent(tag, attributes, program) {
    return {
      type: "ComponentNode",
      tag: tag,
      attributes: attributes,
      program: program
    };
  }

  function buildAttr(name, value) {
    return {
      type: "AttrNode",
      name: name,
      value: value
    };
  }

  function buildText(chars) {
    return {
      type: "TextNode",
      chars: chars
    };
  }

  function buildSexpr(path, params, hash) {
    return {
      type: "SubExpression",
      path: path,
      params: params || [],
      hash: hash || buildHash([])
    };
  }

  function buildPath(original) {
    return {
      type: "PathExpression",
      original: original,
      parts: original.split(".")
    };
  }

  function buildString(value) {
    return {
      type: "StringLiteral",
      value: value,
      original: value
    };
  }

  function buildBoolean(value) {
    return {
      type: "BooleanLiteral",
      value: value,
      original: value
    };
  }

  function buildNumber(value) {
    return {
      type: "NumberLiteral",
      value: value,
      original: value
    };
  }

  function buildNull() {
    return {
      type: "NullLiteral",
      value: null,
      original: null
    };
  }

  function buildUndefined() {
    return {
      type: "UndefinedLiteral",
      value: undefined,
      original: undefined
    };
  }

  function buildHash(pairs) {
    return {
      type: "Hash",
      pairs: pairs || []
    };
  }

  function buildPair(key, value) {
    return {
      type: "HashPair",
      key: key,
      value: value
    };
  }

  function buildProgram(body, blockParams, loc) {
    return {
      type: "Program",
      body: body || [],
      blockParams: blockParams || [],
      loc: buildLoc(loc)
    };
  }

  function buildPosition(line, column) {
    return {
      line: line,
      column: column
    };
  }

  function buildLoc(loc) {
    if (loc) {
      return {
        source: loc.source || null,
        start: buildPosition(loc.start.line, loc.start.column),
        end: buildPosition(loc.end.line, loc.end.column)
      };
    } else {
      return null;
    }
  }

  exports['default'] = {
    mustache: buildMustache,
    block: buildBlock,
    partial: buildPartial,
    comment: buildComment,
    element: buildElement,
    elementModifier: buildElementModifier,
    component: buildComponent,
    attr: buildAttr,
    text: buildText,
    sexpr: buildSexpr,
    path: buildPath,
    string: buildString,
    "boolean": buildBoolean,
    number: buildNumber,
    undefined: buildUndefined,
    "null": buildNull,
    concat: buildConcat,
    hash: buildHash,
    pair: buildPair,
    program: buildProgram,
    loc: buildLoc,
    pos: buildPosition
  };

});
enifed('htmlbars-syntax/handlebars/compiler/ast', ['exports'], function (exports) {

  'use strict';

  var AST = {
    Program: function (statements, blockParams, strip, locInfo) {
      this.loc = locInfo;
      this.type = 'Program';
      this.body = statements;

      this.blockParams = blockParams;
      this.strip = strip;
    },

    MustacheStatement: function (path, params, hash, escaped, strip, locInfo) {
      this.loc = locInfo;
      this.type = 'MustacheStatement';

      this.path = path;
      this.params = params || [];
      this.hash = hash;
      this.escaped = escaped;

      this.strip = strip;
    },

    BlockStatement: function (path, params, hash, program, inverse, openStrip, inverseStrip, closeStrip, locInfo) {
      this.loc = locInfo;
      this.type = 'BlockStatement';

      this.path = path;
      this.params = params || [];
      this.hash = hash;
      this.program = program;
      this.inverse = inverse;

      this.openStrip = openStrip;
      this.inverseStrip = inverseStrip;
      this.closeStrip = closeStrip;
    },

    PartialStatement: function (name, params, hash, strip, locInfo) {
      this.loc = locInfo;
      this.type = 'PartialStatement';

      this.name = name;
      this.params = params || [];
      this.hash = hash;

      this.indent = '';
      this.strip = strip;
    },

    ContentStatement: function (string, locInfo) {
      this.loc = locInfo;
      this.type = 'ContentStatement';
      this.original = this.value = string;
    },

    CommentStatement: function (comment, strip, locInfo) {
      this.loc = locInfo;
      this.type = 'CommentStatement';
      this.value = comment;

      this.strip = strip;
    },

    SubExpression: function (path, params, hash, locInfo) {
      this.loc = locInfo;

      this.type = 'SubExpression';
      this.path = path;
      this.params = params || [];
      this.hash = hash;
    },

    PathExpression: function (data, depth, parts, original, locInfo) {
      this.loc = locInfo;
      this.type = 'PathExpression';

      this.data = data;
      this.original = original;
      this.parts = parts;
      this.depth = depth;
    },

    StringLiteral: function (string, locInfo) {
      this.loc = locInfo;
      this.type = 'StringLiteral';
      this.original = this.value = string;
    },

    NumberLiteral: function (number, locInfo) {
      this.loc = locInfo;
      this.type = 'NumberLiteral';
      this.original = this.value = Number(number);
    },

    BooleanLiteral: function (bool, locInfo) {
      this.loc = locInfo;
      this.type = 'BooleanLiteral';
      this.original = this.value = bool === 'true';
    },

    UndefinedLiteral: function (locInfo) {
      this.loc = locInfo;
      this.type = 'UndefinedLiteral';
      this.original = this.value = undefined;
    },

    NullLiteral: function (locInfo) {
      this.loc = locInfo;
      this.type = 'NullLiteral';
      this.original = this.value = null;
    },

    Hash: function (pairs, locInfo) {
      this.loc = locInfo;
      this.type = 'Hash';
      this.pairs = pairs;
    },
    HashPair: function (key, value, locInfo) {
      this.loc = locInfo;
      this.type = 'HashPair';
      this.key = key;
      this.value = value;
    },

    // Public API used to evaluate derived attributes regarding AST nodes
    helpers: {
      // a mustache is definitely a helper if:
      // * it is an eligible helper, and
      // * it has at least one parameter or hash segment
      helperExpression: function (node) {
        return !!(node.type === 'SubExpression' || node.params.length || node.hash);
      },

      scopedId: function (path) {
        return /^\.|this\b/.test(path.original);
      },

      // an ID is simple if it only has one part, and that part is not
      // `..` or `this`.
      simpleId: function (path) {
        return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
      }
    }
  };

  // Must be exported as an object rather than the root of the module as the jison lexer
  // must modify the object to operate properly.
  exports['default'] = AST;

});
enifed('htmlbars-syntax/handlebars/compiler/base', ['exports', './parser', './ast', './whitespace-control', './helpers', '../utils'], function (exports, parser, AST, WhitespaceControl, Helpers, utils) {

  'use strict';

  exports.parse = parse;

  var yy = {};
  utils.extend(yy, Helpers, AST['default']);
  function parse(input, options) {
    // Just return if an already-compiled AST was passed in.
    if (input.type === 'Program') {
      return input;
    }

    parser['default'].yy = yy;

    // Altering the shared object here, but this is ok as parser is a sync operation
    yy.locInfo = function (locInfo) {
      return new yy.SourceLocation(options && options.srcName, locInfo);
    };

    var strip = new WhitespaceControl['default']();
    return strip.accept(parser['default'].parse(input));
  }

  exports.parser = parser['default'];

});
enifed('htmlbars-syntax/handlebars/compiler/helpers', ['exports', '../exception'], function (exports, Exception) {

  'use strict';

  exports.SourceLocation = SourceLocation;
  exports.id = id;
  exports.stripFlags = stripFlags;
  exports.stripComment = stripComment;
  exports.preparePath = preparePath;
  exports.prepareMustache = prepareMustache;
  exports.prepareRawBlock = prepareRawBlock;
  exports.prepareBlock = prepareBlock;

  function SourceLocation(source, locInfo) {
    this.source = source;
    this.start = {
      line: locInfo.first_line,
      column: locInfo.first_column
    };
    this.end = {
      line: locInfo.last_line,
      column: locInfo.last_column
    };
  }

  function id(token) {
    if (/^\[.*\]$/.test(token)) {
      return token.substr(1, token.length - 2);
    } else {
      return token;
    }
  }

  function stripFlags(open, close) {
    return {
      open: open.charAt(2) === '~',
      close: close.charAt(close.length - 3) === '~'
    };
  }

  function stripComment(comment) {
    return comment.replace(/^\{\{~?\!-?-?/, '').replace(/-?-?~?\}\}$/, '');
  }

  function preparePath(data, parts, locInfo) {
    locInfo = this.locInfo(locInfo);

    var original = data ? '@' : '',
        dig = [],
        depth = 0,
        depthString = '';

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i].part,

      // If we have [] syntax then we do not treat path references as operators,
      // i.e. foo.[this] resolves to approximately context.foo['this']
      isLiteral = parts[i].original !== part;
      original += (parts[i].separator || '') + part;

      if (!isLiteral && (part === '..' || part === '.' || part === 'this')) {
        if (dig.length > 0) {
          throw new Exception['default']('Invalid path: ' + original, { loc: locInfo });
        } else if (part === '..') {
          depth++;
          depthString += '../';
        }
      } else {
        dig.push(part);
      }
    }

    return new this.PathExpression(data, depth, dig, original, locInfo);
  }

  function prepareMustache(path, params, hash, open, strip, locInfo) {
    // Must use charAt to support IE pre-10
    var escapeFlag = open.charAt(3) || open.charAt(2),
        escaped = escapeFlag !== '{' && escapeFlag !== '&';

    return new this.MustacheStatement(path, params, hash, escaped, strip, this.locInfo(locInfo));
  }

  function prepareRawBlock(openRawBlock, content, close, locInfo) {
    if (openRawBlock.path.original !== close) {
      var errorNode = { loc: openRawBlock.path.loc };

      throw new Exception['default'](openRawBlock.path.original + ' doesn\'t match ' + close, errorNode);
    }

    locInfo = this.locInfo(locInfo);
    var program = new this.Program([content], null, {}, locInfo);

    return new this.BlockStatement(openRawBlock.path, openRawBlock.params, openRawBlock.hash, program, undefined, {}, {}, {}, locInfo);
  }

  function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
    // When we are chaining inverse calls, we will not have a close path
    if (close && close.path && openBlock.path.original !== close.path.original) {
      var errorNode = { loc: openBlock.path.loc };

      throw new Exception['default'](openBlock.path.original + ' doesn\'t match ' + close.path.original, errorNode);
    }

    program.blockParams = openBlock.blockParams;

    var inverse = undefined,
        inverseStrip = undefined;

    if (inverseAndProgram) {
      if (inverseAndProgram.chain) {
        inverseAndProgram.program.body[0].closeStrip = close.strip;
      }

      inverseStrip = inverseAndProgram.strip;
      inverse = inverseAndProgram.program;
    }

    if (inverted) {
      inverted = inverse;
      inverse = program;
      program = inverted;
    }

    return new this.BlockStatement(openBlock.path, openBlock.params, openBlock.hash, program, inverse, openBlock.strip, inverseStrip, close && close.strip, this.locInfo(locInfo));
  }

});
enifed('htmlbars-syntax/handlebars/compiler/parser', ['exports'], function (exports) {

    'use strict';

    /* istanbul ignore next */
    /* Jison generated parser */
    var handlebars = (function () {
        var parser = { trace: function trace() {},
            yy: {},
            symbols_: { "error": 2, "root": 3, "program": 4, "EOF": 5, "program_repetition0": 6, "statement": 7, "mustache": 8, "block": 9, "rawBlock": 10, "partial": 11, "content": 12, "COMMENT": 13, "CONTENT": 14, "openRawBlock": 15, "END_RAW_BLOCK": 16, "OPEN_RAW_BLOCK": 17, "helperName": 18, "openRawBlock_repetition0": 19, "openRawBlock_option0": 20, "CLOSE_RAW_BLOCK": 21, "openBlock": 22, "block_option0": 23, "closeBlock": 24, "openInverse": 25, "block_option1": 26, "OPEN_BLOCK": 27, "openBlock_repetition0": 28, "openBlock_option0": 29, "openBlock_option1": 30, "CLOSE": 31, "OPEN_INVERSE": 32, "openInverse_repetition0": 33, "openInverse_option0": 34, "openInverse_option1": 35, "openInverseChain": 36, "OPEN_INVERSE_CHAIN": 37, "openInverseChain_repetition0": 38, "openInverseChain_option0": 39, "openInverseChain_option1": 40, "inverseAndProgram": 41, "INVERSE": 42, "inverseChain": 43, "inverseChain_option0": 44, "OPEN_ENDBLOCK": 45, "OPEN": 46, "mustache_repetition0": 47, "mustache_option0": 48, "OPEN_UNESCAPED": 49, "mustache_repetition1": 50, "mustache_option1": 51, "CLOSE_UNESCAPED": 52, "OPEN_PARTIAL": 53, "partialName": 54, "partial_repetition0": 55, "partial_option0": 56, "param": 57, "sexpr": 58, "OPEN_SEXPR": 59, "sexpr_repetition0": 60, "sexpr_option0": 61, "CLOSE_SEXPR": 62, "hash": 63, "hash_repetition_plus0": 64, "hashSegment": 65, "ID": 66, "EQUALS": 67, "blockParams": 68, "OPEN_BLOCK_PARAMS": 69, "blockParams_repetition_plus0": 70, "CLOSE_BLOCK_PARAMS": 71, "path": 72, "dataName": 73, "STRING": 74, "NUMBER": 75, "BOOLEAN": 76, "UNDEFINED": 77, "NULL": 78, "DATA": 79, "pathSegments": 80, "SEP": 81, "$accept": 0, "$end": 1 },
            terminals_: { 2: "error", 5: "EOF", 13: "COMMENT", 14: "CONTENT", 16: "END_RAW_BLOCK", 17: "OPEN_RAW_BLOCK", 21: "CLOSE_RAW_BLOCK", 27: "OPEN_BLOCK", 31: "CLOSE", 32: "OPEN_INVERSE", 37: "OPEN_INVERSE_CHAIN", 42: "INVERSE", 45: "OPEN_ENDBLOCK", 46: "OPEN", 49: "OPEN_UNESCAPED", 52: "CLOSE_UNESCAPED", 53: "OPEN_PARTIAL", 59: "OPEN_SEXPR", 62: "CLOSE_SEXPR", 66: "ID", 67: "EQUALS", 69: "OPEN_BLOCK_PARAMS", 71: "CLOSE_BLOCK_PARAMS", 74: "STRING", 75: "NUMBER", 76: "BOOLEAN", 77: "UNDEFINED", 78: "NULL", 79: "DATA", 81: "SEP" },
            productions_: [0, [3, 2], [4, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [12, 1], [10, 3], [15, 5], [9, 4], [9, 4], [22, 6], [25, 6], [36, 6], [41, 2], [43, 3], [43, 1], [24, 3], [8, 5], [8, 5], [11, 5], [57, 1], [57, 1], [58, 5], [63, 1], [65, 3], [68, 3], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [54, 1], [54, 1], [73, 2], [72, 1], [80, 3], [80, 1], [6, 0], [6, 2], [19, 0], [19, 2], [20, 0], [20, 1], [23, 0], [23, 1], [26, 0], [26, 1], [28, 0], [28, 2], [29, 0], [29, 1], [30, 0], [30, 1], [33, 0], [33, 2], [34, 0], [34, 1], [35, 0], [35, 1], [38, 0], [38, 2], [39, 0], [39, 1], [40, 0], [40, 1], [44, 0], [44, 1], [47, 0], [47, 2], [48, 0], [48, 1], [50, 0], [50, 2], [51, 0], [51, 1], [55, 0], [55, 2], [56, 0], [56, 1], [60, 0], [60, 2], [61, 0], [61, 1], [64, 1], [64, 2], [70, 1], [70, 2]],
            performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

                var $0 = $$.length - 1;
                switch (yystate) {
                    case 1:
                        return $$[$0 - 1];
                        break;
                    case 2:
                        this.$ = new yy.Program($$[$0], null, {}, yy.locInfo(this._$));
                        break;
                    case 3:
                        this.$ = $$[$0];
                        break;
                    case 4:
                        this.$ = $$[$0];
                        break;
                    case 5:
                        this.$ = $$[$0];
                        break;
                    case 6:
                        this.$ = $$[$0];
                        break;
                    case 7:
                        this.$ = $$[$0];
                        break;
                    case 8:
                        this.$ = new yy.CommentStatement(yy.stripComment($$[$0]), yy.stripFlags($$[$0], $$[$0]), yy.locInfo(this._$));
                        break;
                    case 9:
                        this.$ = new yy.ContentStatement($$[$0], yy.locInfo(this._$));
                        break;
                    case 10:
                        this.$ = yy.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
                        break;
                    case 11:
                        this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1] };
                        break;
                    case 12:
                        this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
                        break;
                    case 13:
                        this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
                        break;
                    case 14:
                        this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                        break;
                    case 15:
                        this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                        break;
                    case 16:
                        this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                        break;
                    case 17:
                        this.$ = { strip: yy.stripFlags($$[$0 - 1], $$[$0 - 1]), program: $$[$0] };
                        break;
                    case 18:
                        var inverse = yy.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$),
                            program = new yy.Program([inverse], null, {}, yy.locInfo(this._$));
                        program.chained = true;

                        this.$ = { strip: $$[$0 - 2].strip, program: program, chain: true };

                        break;
                    case 19:
                        this.$ = $$[$0];
                        break;
                    case 20:
                        this.$ = { path: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 2], $$[$0]) };
                        break;
                    case 21:
                        this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
                        break;
                    case 22:
                        this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
                        break;
                    case 23:
                        this.$ = new yy.PartialStatement($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], yy.stripFlags($$[$0 - 4], $$[$0]), yy.locInfo(this._$));
                        break;
                    case 24:
                        this.$ = $$[$0];
                        break;
                    case 25:
                        this.$ = $$[$0];
                        break;
                    case 26:
                        this.$ = new yy.SubExpression($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], yy.locInfo(this._$));
                        break;
                    case 27:
                        this.$ = new yy.Hash($$[$0], yy.locInfo(this._$));
                        break;
                    case 28:
                        this.$ = new yy.HashPair(yy.id($$[$0 - 2]), $$[$0], yy.locInfo(this._$));
                        break;
                    case 29:
                        this.$ = yy.id($$[$0 - 1]);
                        break;
                    case 30:
                        this.$ = $$[$0];
                        break;
                    case 31:
                        this.$ = $$[$0];
                        break;
                    case 32:
                        this.$ = new yy.StringLiteral($$[$0], yy.locInfo(this._$));
                        break;
                    case 33:
                        this.$ = new yy.NumberLiteral($$[$0], yy.locInfo(this._$));
                        break;
                    case 34:
                        this.$ = new yy.BooleanLiteral($$[$0], yy.locInfo(this._$));
                        break;
                    case 35:
                        this.$ = new yy.UndefinedLiteral(yy.locInfo(this._$));
                        break;
                    case 36:
                        this.$ = new yy.NullLiteral(yy.locInfo(this._$));
                        break;
                    case 37:
                        this.$ = $$[$0];
                        break;
                    case 38:
                        this.$ = $$[$0];
                        break;
                    case 39:
                        this.$ = yy.preparePath(true, $$[$0], this._$);
                        break;
                    case 40:
                        this.$ = yy.preparePath(false, $$[$0], this._$);
                        break;
                    case 41:
                        $$[$0 - 2].push({ part: yy.id($$[$0]), original: $$[$0], separator: $$[$0 - 1] });this.$ = $$[$0 - 2];
                        break;
                    case 42:
                        this.$ = [{ part: yy.id($$[$0]), original: $$[$0] }];
                        break;
                    case 43:
                        this.$ = [];
                        break;
                    case 44:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 45:
                        this.$ = [];
                        break;
                    case 46:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 53:
                        this.$ = [];
                        break;
                    case 54:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 59:
                        this.$ = [];
                        break;
                    case 60:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 65:
                        this.$ = [];
                        break;
                    case 66:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 73:
                        this.$ = [];
                        break;
                    case 74:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 77:
                        this.$ = [];
                        break;
                    case 78:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 81:
                        this.$ = [];
                        break;
                    case 82:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 85:
                        this.$ = [];
                        break;
                    case 86:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 89:
                        this.$ = [$$[$0]];
                        break;
                    case 90:
                        $$[$0 - 1].push($$[$0]);
                        break;
                    case 91:
                        this.$ = [$$[$0]];
                        break;
                    case 92:
                        $$[$0 - 1].push($$[$0]);
                        break;
                }
            },
            table: [{ 3: 1, 4: 2, 5: [2, 43], 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 1: [3] }, { 5: [1, 4] }, { 5: [2, 2], 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: [1, 11], 14: [1, 18], 15: 16, 17: [1, 21], 22: 14, 25: 15, 27: [1, 19], 32: [1, 20], 37: [2, 2], 42: [2, 2], 45: [2, 2], 46: [1, 12], 49: [1, 13], 53: [1, 17] }, { 1: [2, 1] }, { 5: [2, 44], 13: [2, 44], 14: [2, 44], 17: [2, 44], 27: [2, 44], 32: [2, 44], 37: [2, 44], 42: [2, 44], 45: [2, 44], 46: [2, 44], 49: [2, 44], 53: [2, 44] }, { 5: [2, 3], 13: [2, 3], 14: [2, 3], 17: [2, 3], 27: [2, 3], 32: [2, 3], 37: [2, 3], 42: [2, 3], 45: [2, 3], 46: [2, 3], 49: [2, 3], 53: [2, 3] }, { 5: [2, 4], 13: [2, 4], 14: [2, 4], 17: [2, 4], 27: [2, 4], 32: [2, 4], 37: [2, 4], 42: [2, 4], 45: [2, 4], 46: [2, 4], 49: [2, 4], 53: [2, 4] }, { 5: [2, 5], 13: [2, 5], 14: [2, 5], 17: [2, 5], 27: [2, 5], 32: [2, 5], 37: [2, 5], 42: [2, 5], 45: [2, 5], 46: [2, 5], 49: [2, 5], 53: [2, 5] }, { 5: [2, 6], 13: [2, 6], 14: [2, 6], 17: [2, 6], 27: [2, 6], 32: [2, 6], 37: [2, 6], 42: [2, 6], 45: [2, 6], 46: [2, 6], 49: [2, 6], 53: [2, 6] }, { 5: [2, 7], 13: [2, 7], 14: [2, 7], 17: [2, 7], 27: [2, 7], 32: [2, 7], 37: [2, 7], 42: [2, 7], 45: [2, 7], 46: [2, 7], 49: [2, 7], 53: [2, 7] }, { 5: [2, 8], 13: [2, 8], 14: [2, 8], 17: [2, 8], 27: [2, 8], 32: [2, 8], 37: [2, 8], 42: [2, 8], 45: [2, 8], 46: [2, 8], 49: [2, 8], 53: [2, 8] }, { 18: 22, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 33, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 4: 34, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 37: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 4: 35, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 12: 36, 14: [1, 18] }, { 18: 38, 54: 37, 58: 39, 59: [1, 40], 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 9], 13: [2, 9], 14: [2, 9], 16: [2, 9], 17: [2, 9], 27: [2, 9], 32: [2, 9], 37: [2, 9], 42: [2, 9], 45: [2, 9], 46: [2, 9], 49: [2, 9], 53: [2, 9] }, { 18: 41, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 42, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 43, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 31: [2, 73], 47: 44, 59: [2, 73], 66: [2, 73], 74: [2, 73], 75: [2, 73], 76: [2, 73], 77: [2, 73], 78: [2, 73], 79: [2, 73] }, { 21: [2, 30], 31: [2, 30], 52: [2, 30], 59: [2, 30], 62: [2, 30], 66: [2, 30], 69: [2, 30], 74: [2, 30], 75: [2, 30], 76: [2, 30], 77: [2, 30], 78: [2, 30], 79: [2, 30] }, { 21: [2, 31], 31: [2, 31], 52: [2, 31], 59: [2, 31], 62: [2, 31], 66: [2, 31], 69: [2, 31], 74: [2, 31], 75: [2, 31], 76: [2, 31], 77: [2, 31], 78: [2, 31], 79: [2, 31] }, { 21: [2, 32], 31: [2, 32], 52: [2, 32], 59: [2, 32], 62: [2, 32], 66: [2, 32], 69: [2, 32], 74: [2, 32], 75: [2, 32], 76: [2, 32], 77: [2, 32], 78: [2, 32], 79: [2, 32] }, { 21: [2, 33], 31: [2, 33], 52: [2, 33], 59: [2, 33], 62: [2, 33], 66: [2, 33], 69: [2, 33], 74: [2, 33], 75: [2, 33], 76: [2, 33], 77: [2, 33], 78: [2, 33], 79: [2, 33] }, { 21: [2, 34], 31: [2, 34], 52: [2, 34], 59: [2, 34], 62: [2, 34], 66: [2, 34], 69: [2, 34], 74: [2, 34], 75: [2, 34], 76: [2, 34], 77: [2, 34], 78: [2, 34], 79: [2, 34] }, { 21: [2, 35], 31: [2, 35], 52: [2, 35], 59: [2, 35], 62: [2, 35], 66: [2, 35], 69: [2, 35], 74: [2, 35], 75: [2, 35], 76: [2, 35], 77: [2, 35], 78: [2, 35], 79: [2, 35] }, { 21: [2, 36], 31: [2, 36], 52: [2, 36], 59: [2, 36], 62: [2, 36], 66: [2, 36], 69: [2, 36], 74: [2, 36], 75: [2, 36], 76: [2, 36], 77: [2, 36], 78: [2, 36], 79: [2, 36] }, { 21: [2, 40], 31: [2, 40], 52: [2, 40], 59: [2, 40], 62: [2, 40], 66: [2, 40], 69: [2, 40], 74: [2, 40], 75: [2, 40], 76: [2, 40], 77: [2, 40], 78: [2, 40], 79: [2, 40], 81: [1, 45] }, { 66: [1, 32], 80: 46 }, { 21: [2, 42], 31: [2, 42], 52: [2, 42], 59: [2, 42], 62: [2, 42], 66: [2, 42], 69: [2, 42], 74: [2, 42], 75: [2, 42], 76: [2, 42], 77: [2, 42], 78: [2, 42], 79: [2, 42], 81: [2, 42] }, { 50: 47, 52: [2, 77], 59: [2, 77], 66: [2, 77], 74: [2, 77], 75: [2, 77], 76: [2, 77], 77: [2, 77], 78: [2, 77], 79: [2, 77] }, { 23: 48, 36: 50, 37: [1, 52], 41: 51, 42: [1, 53], 43: 49, 45: [2, 49] }, { 26: 54, 41: 55, 42: [1, 53], 45: [2, 51] }, { 16: [1, 56] }, { 31: [2, 81], 55: 57, 59: [2, 81], 66: [2, 81], 74: [2, 81], 75: [2, 81], 76: [2, 81], 77: [2, 81], 78: [2, 81], 79: [2, 81] }, { 31: [2, 37], 59: [2, 37], 66: [2, 37], 74: [2, 37], 75: [2, 37], 76: [2, 37], 77: [2, 37], 78: [2, 37], 79: [2, 37] }, { 31: [2, 38], 59: [2, 38], 66: [2, 38], 74: [2, 38], 75: [2, 38], 76: [2, 38], 77: [2, 38], 78: [2, 38], 79: [2, 38] }, { 18: 58, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 28: 59, 31: [2, 53], 59: [2, 53], 66: [2, 53], 69: [2, 53], 74: [2, 53], 75: [2, 53], 76: [2, 53], 77: [2, 53], 78: [2, 53], 79: [2, 53] }, { 31: [2, 59], 33: 60, 59: [2, 59], 66: [2, 59], 69: [2, 59], 74: [2, 59], 75: [2, 59], 76: [2, 59], 77: [2, 59], 78: [2, 59], 79: [2, 59] }, { 19: 61, 21: [2, 45], 59: [2, 45], 66: [2, 45], 74: [2, 45], 75: [2, 45], 76: [2, 45], 77: [2, 45], 78: [2, 45], 79: [2, 45] }, { 18: 65, 31: [2, 75], 48: 62, 57: 63, 58: 66, 59: [1, 40], 63: 64, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 66: [1, 70] }, { 21: [2, 39], 31: [2, 39], 52: [2, 39], 59: [2, 39], 62: [2, 39], 66: [2, 39], 69: [2, 39], 74: [2, 39], 75: [2, 39], 76: [2, 39], 77: [2, 39], 78: [2, 39], 79: [2, 39], 81: [1, 45] }, { 18: 65, 51: 71, 52: [2, 79], 57: 72, 58: 66, 59: [1, 40], 63: 73, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 24: 74, 45: [1, 75] }, { 45: [2, 50] }, { 4: 76, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 37: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 45: [2, 19] }, { 18: 77, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 4: 78, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 24: 79, 45: [1, 75] }, { 45: [2, 52] }, { 5: [2, 10], 13: [2, 10], 14: [2, 10], 17: [2, 10], 27: [2, 10], 32: [2, 10], 37: [2, 10], 42: [2, 10], 45: [2, 10], 46: [2, 10], 49: [2, 10], 53: [2, 10] }, { 18: 65, 31: [2, 83], 56: 80, 57: 81, 58: 66, 59: [1, 40], 63: 82, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 59: [2, 85], 60: 83, 62: [2, 85], 66: [2, 85], 74: [2, 85], 75: [2, 85], 76: [2, 85], 77: [2, 85], 78: [2, 85], 79: [2, 85] }, { 18: 65, 29: 84, 31: [2, 55], 57: 85, 58: 66, 59: [1, 40], 63: 86, 64: 67, 65: 68, 66: [1, 69], 69: [2, 55], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 65, 31: [2, 61], 34: 87, 57: 88, 58: 66, 59: [1, 40], 63: 89, 64: 67, 65: 68, 66: [1, 69], 69: [2, 61], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 65, 20: 90, 21: [2, 47], 57: 91, 58: 66, 59: [1, 40], 63: 92, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 31: [1, 93] }, { 31: [2, 74], 59: [2, 74], 66: [2, 74], 74: [2, 74], 75: [2, 74], 76: [2, 74], 77: [2, 74], 78: [2, 74], 79: [2, 74] }, { 31: [2, 76] }, { 21: [2, 24], 31: [2, 24], 52: [2, 24], 59: [2, 24], 62: [2, 24], 66: [2, 24], 69: [2, 24], 74: [2, 24], 75: [2, 24], 76: [2, 24], 77: [2, 24], 78: [2, 24], 79: [2, 24] }, { 21: [2, 25], 31: [2, 25], 52: [2, 25], 59: [2, 25], 62: [2, 25], 66: [2, 25], 69: [2, 25], 74: [2, 25], 75: [2, 25], 76: [2, 25], 77: [2, 25], 78: [2, 25], 79: [2, 25] }, { 21: [2, 27], 31: [2, 27], 52: [2, 27], 62: [2, 27], 65: 94, 66: [1, 95], 69: [2, 27] }, { 21: [2, 89], 31: [2, 89], 52: [2, 89], 62: [2, 89], 66: [2, 89], 69: [2, 89] }, { 21: [2, 42], 31: [2, 42], 52: [2, 42], 59: [2, 42], 62: [2, 42], 66: [2, 42], 67: [1, 96], 69: [2, 42], 74: [2, 42], 75: [2, 42], 76: [2, 42], 77: [2, 42], 78: [2, 42], 79: [2, 42], 81: [2, 42] }, { 21: [2, 41], 31: [2, 41], 52: [2, 41], 59: [2, 41], 62: [2, 41], 66: [2, 41], 69: [2, 41], 74: [2, 41], 75: [2, 41], 76: [2, 41], 77: [2, 41], 78: [2, 41], 79: [2, 41], 81: [2, 41] }, { 52: [1, 97] }, { 52: [2, 78], 59: [2, 78], 66: [2, 78], 74: [2, 78], 75: [2, 78], 76: [2, 78], 77: [2, 78], 78: [2, 78], 79: [2, 78] }, { 52: [2, 80] }, { 5: [2, 12], 13: [2, 12], 14: [2, 12], 17: [2, 12], 27: [2, 12], 32: [2, 12], 37: [2, 12], 42: [2, 12], 45: [2, 12], 46: [2, 12], 49: [2, 12], 53: [2, 12] }, { 18: 98, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 36: 50, 37: [1, 52], 41: 51, 42: [1, 53], 43: 100, 44: 99, 45: [2, 71] }, { 31: [2, 65], 38: 101, 59: [2, 65], 66: [2, 65], 69: [2, 65], 74: [2, 65], 75: [2, 65], 76: [2, 65], 77: [2, 65], 78: [2, 65], 79: [2, 65] }, { 45: [2, 17] }, { 5: [2, 13], 13: [2, 13], 14: [2, 13], 17: [2, 13], 27: [2, 13], 32: [2, 13], 37: [2, 13], 42: [2, 13], 45: [2, 13], 46: [2, 13], 49: [2, 13], 53: [2, 13] }, { 31: [1, 102] }, { 31: [2, 82], 59: [2, 82], 66: [2, 82], 74: [2, 82], 75: [2, 82], 76: [2, 82], 77: [2, 82], 78: [2, 82], 79: [2, 82] }, { 31: [2, 84] }, { 18: 65, 57: 104, 58: 66, 59: [1, 40], 61: 103, 62: [2, 87], 63: 105, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 30: 106, 31: [2, 57], 68: 107, 69: [1, 108] }, { 31: [2, 54], 59: [2, 54], 66: [2, 54], 69: [2, 54], 74: [2, 54], 75: [2, 54], 76: [2, 54], 77: [2, 54], 78: [2, 54], 79: [2, 54] }, { 31: [2, 56], 69: [2, 56] }, { 31: [2, 63], 35: 109, 68: 110, 69: [1, 108] }, { 31: [2, 60], 59: [2, 60], 66: [2, 60], 69: [2, 60], 74: [2, 60], 75: [2, 60], 76: [2, 60], 77: [2, 60], 78: [2, 60], 79: [2, 60] }, { 31: [2, 62], 69: [2, 62] }, { 21: [1, 111] }, { 21: [2, 46], 59: [2, 46], 66: [2, 46], 74: [2, 46], 75: [2, 46], 76: [2, 46], 77: [2, 46], 78: [2, 46], 79: [2, 46] }, { 21: [2, 48] }, { 5: [2, 21], 13: [2, 21], 14: [2, 21], 17: [2, 21], 27: [2, 21], 32: [2, 21], 37: [2, 21], 42: [2, 21], 45: [2, 21], 46: [2, 21], 49: [2, 21], 53: [2, 21] }, { 21: [2, 90], 31: [2, 90], 52: [2, 90], 62: [2, 90], 66: [2, 90], 69: [2, 90] }, { 67: [1, 96] }, { 18: 65, 57: 112, 58: 66, 59: [1, 40], 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 22], 13: [2, 22], 14: [2, 22], 17: [2, 22], 27: [2, 22], 32: [2, 22], 37: [2, 22], 42: [2, 22], 45: [2, 22], 46: [2, 22], 49: [2, 22], 53: [2, 22] }, { 31: [1, 113] }, { 45: [2, 18] }, { 45: [2, 72] }, { 18: 65, 31: [2, 67], 39: 114, 57: 115, 58: 66, 59: [1, 40], 63: 116, 64: 67, 65: 68, 66: [1, 69], 69: [2, 67], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 23], 13: [2, 23], 14: [2, 23], 17: [2, 23], 27: [2, 23], 32: [2, 23], 37: [2, 23], 42: [2, 23], 45: [2, 23], 46: [2, 23], 49: [2, 23], 53: [2, 23] }, { 62: [1, 117] }, { 59: [2, 86], 62: [2, 86], 66: [2, 86], 74: [2, 86], 75: [2, 86], 76: [2, 86], 77: [2, 86], 78: [2, 86], 79: [2, 86] }, { 62: [2, 88] }, { 31: [1, 118] }, { 31: [2, 58] }, { 66: [1, 120], 70: 119 }, { 31: [1, 121] }, { 31: [2, 64] }, { 14: [2, 11] }, { 21: [2, 28], 31: [2, 28], 52: [2, 28], 62: [2, 28], 66: [2, 28], 69: [2, 28] }, { 5: [2, 20], 13: [2, 20], 14: [2, 20], 17: [2, 20], 27: [2, 20], 32: [2, 20], 37: [2, 20], 42: [2, 20], 45: [2, 20], 46: [2, 20], 49: [2, 20], 53: [2, 20] }, { 31: [2, 69], 40: 122, 68: 123, 69: [1, 108] }, { 31: [2, 66], 59: [2, 66], 66: [2, 66], 69: [2, 66], 74: [2, 66], 75: [2, 66], 76: [2, 66], 77: [2, 66], 78: [2, 66], 79: [2, 66] }, { 31: [2, 68], 69: [2, 68] }, { 21: [2, 26], 31: [2, 26], 52: [2, 26], 59: [2, 26], 62: [2, 26], 66: [2, 26], 69: [2, 26], 74: [2, 26], 75: [2, 26], 76: [2, 26], 77: [2, 26], 78: [2, 26], 79: [2, 26] }, { 13: [2, 14], 14: [2, 14], 17: [2, 14], 27: [2, 14], 32: [2, 14], 37: [2, 14], 42: [2, 14], 45: [2, 14], 46: [2, 14], 49: [2, 14], 53: [2, 14] }, { 66: [1, 125], 71: [1, 124] }, { 66: [2, 91], 71: [2, 91] }, { 13: [2, 15], 14: [2, 15], 17: [2, 15], 27: [2, 15], 32: [2, 15], 42: [2, 15], 45: [2, 15], 46: [2, 15], 49: [2, 15], 53: [2, 15] }, { 31: [1, 126] }, { 31: [2, 70] }, { 31: [2, 29] }, { 66: [2, 92], 71: [2, 92] }, { 13: [2, 16], 14: [2, 16], 17: [2, 16], 27: [2, 16], 32: [2, 16], 37: [2, 16], 42: [2, 16], 45: [2, 16], 46: [2, 16], 49: [2, 16], 53: [2, 16] }],
            defaultActions: { 4: [2, 1], 49: [2, 50], 51: [2, 19], 55: [2, 52], 64: [2, 76], 73: [2, 80], 78: [2, 17], 82: [2, 84], 92: [2, 48], 99: [2, 18], 100: [2, 72], 105: [2, 88], 107: [2, 58], 110: [2, 64], 111: [2, 11], 123: [2, 70], 124: [2, 29] },
            parseError: function parseError(str, hash) {
                throw new Error(str);
            },
            parse: function parse(input) {
                var self = this,
                    stack = [0],
                    vstack = [null],
                    lstack = [],
                    table = this.table,
                    yytext = "",
                    yylineno = 0,
                    yyleng = 0,
                    recovering = 0,
                    TERROR = 2,
                    EOF = 1;
                this.lexer.setInput(input);
                this.lexer.yy = this.yy;
                this.yy.lexer = this.lexer;
                this.yy.parser = this;
                if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
                var yyloc = this.lexer.yylloc;
                lstack.push(yyloc);
                var ranges = this.lexer.options && this.lexer.options.ranges;
                if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
                function popStack(n) {
                    stack.length = stack.length - 2 * n;
                    vstack.length = vstack.length - n;
                    lstack.length = lstack.length - n;
                }
                function lex() {
                    var token;
                    token = self.lexer.lex() || 1;
                    if (typeof token !== "number") {
                        token = self.symbols_[token] || token;
                    }
                    return token;
                }
                var symbol,
                    preErrorSymbol,
                    state,
                    action,
                    a,
                    r,
                    yyval = {},
                    p,
                    len,
                    newState,
                    expected;
                while (true) {
                    state = stack[stack.length - 1];
                    if (this.defaultActions[state]) {
                        action = this.defaultActions[state];
                    } else {
                        if (symbol === null || typeof symbol == "undefined") {
                            symbol = lex();
                        }
                        action = table[state] && table[state][symbol];
                    }
                    if (typeof action === "undefined" || !action.length || !action[0]) {
                        var errStr = "";
                        if (!recovering) {
                            expected = [];
                            for (p in table[state]) if (this.terminals_[p] && p > 2) {
                                expected.push("'" + this.terminals_[p] + "'");
                            }
                            if (this.lexer.showPosition) {
                                errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                            } else {
                                errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                            }
                            this.parseError(errStr, { text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected });
                        }
                    }
                    if (action[0] instanceof Array && action.length > 1) {
                        throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                    }
                    switch (action[0]) {
                        case 1:
                            stack.push(symbol);
                            vstack.push(this.lexer.yytext);
                            lstack.push(this.lexer.yylloc);
                            stack.push(action[1]);
                            symbol = null;
                            if (!preErrorSymbol) {
                                yyleng = this.lexer.yyleng;
                                yytext = this.lexer.yytext;
                                yylineno = this.lexer.yylineno;
                                yyloc = this.lexer.yylloc;
                                if (recovering > 0) recovering--;
                            } else {
                                symbol = preErrorSymbol;
                                preErrorSymbol = null;
                            }
                            break;
                        case 2:
                            len = this.productions_[action[1]][1];
                            yyval.$ = vstack[vstack.length - len];
                            yyval._$ = { first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column };
                            if (ranges) {
                                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                            }
                            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                            if (typeof r !== "undefined") {
                                return r;
                            }
                            if (len) {
                                stack = stack.slice(0, -1 * len * 2);
                                vstack = vstack.slice(0, -1 * len);
                                lstack = lstack.slice(0, -1 * len);
                            }
                            stack.push(this.productions_[action[1]][0]);
                            vstack.push(yyval.$);
                            lstack.push(yyval._$);
                            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                            stack.push(newState);
                            break;
                        case 3:
                            return true;
                    }
                }
                return true;
            }
        };
        /* Jison generated lexer */
        var lexer = (function () {
            var lexer = { EOF: 1,
                parseError: function parseError(str, hash) {
                    if (this.yy.parser) {
                        this.yy.parser.parseError(str, hash);
                    } else {
                        throw new Error(str);
                    }
                },
                setInput: function (input) {
                    this._input = input;
                    this._more = this._less = this.done = false;
                    this.yylineno = this.yyleng = 0;
                    this.yytext = this.matched = this.match = "";
                    this.conditionStack = ["INITIAL"];
                    this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 };
                    if (this.options.ranges) this.yylloc.range = [0, 0];
                    this.offset = 0;
                    return this;
                },
                input: function () {
                    var ch = this._input[0];
                    this.yytext += ch;
                    this.yyleng++;
                    this.offset++;
                    this.match += ch;
                    this.matched += ch;
                    var lines = ch.match(/(?:\r\n?|\n).*/g);
                    if (lines) {
                        this.yylineno++;
                        this.yylloc.last_line++;
                    } else {
                        this.yylloc.last_column++;
                    }
                    if (this.options.ranges) this.yylloc.range[1]++;

                    this._input = this._input.slice(1);
                    return ch;
                },
                unput: function (ch) {
                    var len = ch.length;
                    var lines = ch.split(/(?:\r\n?|\n)/g);

                    this._input = ch + this._input;
                    this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                    //this.yyleng -= len;
                    this.offset -= len;
                    var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                    this.match = this.match.substr(0, this.match.length - 1);
                    this.matched = this.matched.substr(0, this.matched.length - 1);

                    if (lines.length - 1) this.yylineno -= lines.length - 1;
                    var r = this.yylloc.range;

                    this.yylloc = { first_line: this.yylloc.first_line,
                        last_line: this.yylineno + 1,
                        first_column: this.yylloc.first_column,
                        last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                    };

                    if (this.options.ranges) {
                        this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                    }
                    return this;
                },
                more: function () {
                    this._more = true;
                    return this;
                },
                less: function (n) {
                    this.unput(this.match.slice(n));
                },
                pastInput: function () {
                    var past = this.matched.substr(0, this.matched.length - this.match.length);
                    return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
                },
                upcomingInput: function () {
                    var next = this.match;
                    if (next.length < 20) {
                        next += this._input.substr(0, 20 - next.length);
                    }
                    return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
                },
                showPosition: function () {
                    var pre = this.pastInput();
                    var c = new Array(pre.length + 1).join("-");
                    return pre + this.upcomingInput() + "\n" + c + "^";
                },
                next: function () {
                    if (this.done) {
                        return this.EOF;
                    }
                    if (!this._input) this.done = true;

                    var token, match, tempMatch, index, col, lines;
                    if (!this._more) {
                        this.yytext = "";
                        this.match = "";
                    }
                    var rules = this._currentRules();
                    for (var i = 0; i < rules.length; i++) {
                        tempMatch = this._input.match(this.rules[rules[i]]);
                        if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                            match = tempMatch;
                            index = i;
                            if (!this.options.flex) break;
                        }
                    }
                    if (match) {
                        lines = match[0].match(/(?:\r\n?|\n).*/g);
                        if (lines) this.yylineno += lines.length;
                        this.yylloc = { first_line: this.yylloc.last_line,
                            last_line: this.yylineno + 1,
                            first_column: this.yylloc.last_column,
                            last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length };
                        this.yytext += match[0];
                        this.match += match[0];
                        this.matches = match;
                        this.yyleng = this.yytext.length;
                        if (this.options.ranges) {
                            this.yylloc.range = [this.offset, this.offset += this.yyleng];
                        }
                        this._more = false;
                        this._input = this._input.slice(match[0].length);
                        this.matched += match[0];
                        token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
                        if (this.done && this._input) this.done = false;
                        if (token) return token;else return;
                    }
                    if (this._input === "") {
                        return this.EOF;
                    } else {
                        return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), { text: "", token: null, line: this.yylineno });
                    }
                },
                lex: function lex() {
                    var r = this.next();
                    if (typeof r !== "undefined") {
                        return r;
                    } else {
                        return this.lex();
                    }
                },
                begin: function begin(condition) {
                    this.conditionStack.push(condition);
                },
                popState: function popState() {
                    return this.conditionStack.pop();
                },
                _currentRules: function _currentRules() {
                    return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
                },
                topState: function () {
                    return this.conditionStack[this.conditionStack.length - 2];
                },
                pushState: function begin(condition) {
                    this.begin(condition);
                } };
            lexer.options = {};
            lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

                function strip(start, end) {
                    return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng - end);
                }

                var YYSTATE = YY_START;
                switch ($avoiding_name_collisions) {
                    case 0:
                        if (yy_.yytext.slice(-2) === "\\\\") {
                            strip(0, 1);
                            this.begin("mu");
                        } else if (yy_.yytext.slice(-1) === "\\") {
                            strip(0, 1);
                            this.begin("emu");
                        } else {
                            this.begin("mu");
                        }
                        if (yy_.yytext) return 14;

                        break;
                    case 1:
                        return 14;
                        break;
                    case 2:
                        this.popState();
                        return 14;

                        break;
                    case 3:
                        yy_.yytext = yy_.yytext.substr(5, yy_.yyleng - 9);
                        this.popState();
                        return 16;

                        break;
                    case 4:
                        return 14;
                        break;
                    case 5:
                        this.popState();
                        return 13;

                        break;
                    case 6:
                        return 59;
                        break;
                    case 7:
                        return 62;
                        break;
                    case 8:
                        return 17;
                        break;
                    case 9:
                        this.popState();
                        this.begin("raw");
                        return 21;

                        break;
                    case 10:
                        return 53;
                        break;
                    case 11:
                        return 27;
                        break;
                    case 12:
                        return 45;
                        break;
                    case 13:
                        this.popState();return 42;
                        break;
                    case 14:
                        this.popState();return 42;
                        break;
                    case 15:
                        return 32;
                        break;
                    case 16:
                        return 37;
                        break;
                    case 17:
                        return 49;
                        break;
                    case 18:
                        return 46;
                        break;
                    case 19:
                        this.unput(yy_.yytext);
                        this.popState();
                        this.begin("com");

                        break;
                    case 20:
                        this.popState();
                        return 13;

                        break;
                    case 21:
                        return 46;
                        break;
                    case 22:
                        return 67;
                        break;
                    case 23:
                        return 66;
                        break;
                    case 24:
                        return 66;
                        break;
                    case 25:
                        return 81;
                        break;
                    case 26:
                        // ignore whitespace
                        break;
                    case 27:
                        this.popState();return 52;
                        break;
                    case 28:
                        this.popState();return 31;
                        break;
                    case 29:
                        yy_.yytext = strip(1, 2).replace(/\\"/g, "\"");return 74;
                        break;
                    case 30:
                        yy_.yytext = strip(1, 2).replace(/\\'/g, "'");return 74;
                        break;
                    case 31:
                        return 79;
                        break;
                    case 32:
                        return 76;
                        break;
                    case 33:
                        return 76;
                        break;
                    case 34:
                        return 77;
                        break;
                    case 35:
                        return 78;
                        break;
                    case 36:
                        return 75;
                        break;
                    case 37:
                        return 69;
                        break;
                    case 38:
                        return 71;
                        break;
                    case 39:
                        return 66;
                        break;
                    case 40:
                        return 66;
                        break;
                    case 41:
                        return "INVALID";
                        break;
                    case 42:
                        return 5;
                        break;
                }
            };
            lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]*?(?=(\{\{\{\{\/)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[[^\]]*\])/, /^(?:.)/, /^(?:$)/];
            lexer.conditions = { "mu": { "rules": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], "inclusive": false }, "emu": { "rules": [2], "inclusive": false }, "com": { "rules": [5], "inclusive": false }, "raw": { "rules": [3, 4], "inclusive": false }, "INITIAL": { "rules": [0, 1, 42], "inclusive": true } };
            return lexer;
        })();
        parser.lexer = lexer;
        function Parser() {
            this.yy = {};
        }Parser.prototype = parser;parser.Parser = Parser;
        return new Parser();
    })();exports['default'] = handlebars;

});
enifed('htmlbars-syntax/handlebars/compiler/visitor', ['exports', '../exception', './ast'], function (exports, Exception, AST) {

  'use strict';

  function Visitor() {
    this.parents = [];
  }

  Visitor.prototype = {
    constructor: Visitor,
    mutating: false,

    // Visits a given value. If mutating, will replace the value if necessary.
    acceptKey: function (node, name) {
      var value = this.accept(node[name]);
      if (this.mutating) {
        // Hacky sanity check:
        if (value && (!value.type || !AST['default'][value.type])) {
          throw new Exception['default']('Unexpected node type "' + value.type + '" found when accepting ' + name + ' on ' + node.type);
        }
        node[name] = value;
      }
    },

    // Performs an accept operation with added sanity check to ensure
    // required keys are not removed.
    acceptRequired: function (node, name) {
      this.acceptKey(node, name);

      if (!node[name]) {
        throw new Exception['default'](node.type + ' requires ' + name);
      }
    },

    // Traverses a given array. If mutating, empty respnses will be removed
    // for child elements.
    acceptArray: function (array) {
      for (var i = 0, l = array.length; i < l; i++) {
        this.acceptKey(array, i);

        if (!array[i]) {
          array.splice(i, 1);
          i--;
          l--;
        }
      }
    },

    accept: function (object) {
      if (!object) {
        return;
      }

      if (this.current) {
        this.parents.unshift(this.current);
      }
      this.current = object;

      var ret = this[object.type](object);

      this.current = this.parents.shift();

      if (!this.mutating || ret) {
        return ret;
      } else if (ret !== false) {
        return object;
      }
    },

    Program: function (program) {
      this.acceptArray(program.body);
    },

    MustacheStatement: function (mustache) {
      this.acceptRequired(mustache, 'path');
      this.acceptArray(mustache.params);
      this.acceptKey(mustache, 'hash');
    },

    BlockStatement: function (block) {
      this.acceptRequired(block, 'path');
      this.acceptArray(block.params);
      this.acceptKey(block, 'hash');

      this.acceptKey(block, 'program');
      this.acceptKey(block, 'inverse');
    },

    PartialStatement: function (partial) {
      this.acceptRequired(partial, 'name');
      this.acceptArray(partial.params);
      this.acceptKey(partial, 'hash');
    },

    ContentStatement: function () {},
    CommentStatement: function () {},

    SubExpression: function (sexpr) {
      this.acceptRequired(sexpr, 'path');
      this.acceptArray(sexpr.params);
      this.acceptKey(sexpr, 'hash');
    },

    PathExpression: function () {},

    StringLiteral: function () {},
    NumberLiteral: function () {},
    BooleanLiteral: function () {},
    UndefinedLiteral: function () {},
    NullLiteral: function () {},

    Hash: function (hash) {
      this.acceptArray(hash.pairs);
    },
    HashPair: function (pair) {
      this.acceptRequired(pair, 'value');
    }
  };

  exports['default'] = Visitor;
  /* content */ /* comment */ /* path */ /* string */ /* number */ /* bool */ /* literal */ /* literal */

});
enifed('htmlbars-syntax/handlebars/compiler/whitespace-control', ['exports', './visitor'], function (exports, Visitor) {

  'use strict';

  function WhitespaceControl() {}
  WhitespaceControl.prototype = new Visitor['default']();

  WhitespaceControl.prototype.Program = function (program) {
    var isRoot = !this.isRootSeen;
    this.isRootSeen = true;

    var body = program.body;
    for (var i = 0, l = body.length; i < l; i++) {
      var current = body[i],
          strip = this.accept(current);

      if (!strip) {
        continue;
      }

      var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot),
          _isNextWhitespace = isNextWhitespace(body, i, isRoot),
          openStandalone = strip.openStandalone && _isPrevWhitespace,
          closeStandalone = strip.closeStandalone && _isNextWhitespace,
          inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;

      if (strip.close) {
        omitRight(body, i, true);
      }
      if (strip.open) {
        omitLeft(body, i, true);
      }

      if (inlineStandalone) {
        omitRight(body, i);

        if (omitLeft(body, i)) {
          // If we are on a standalone node, save the indent info for partials
          if (current.type === 'PartialStatement') {
            // Pull out the whitespace from the final line
            current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
          }
        }
      }
      if (openStandalone) {
        omitRight((current.program || current.inverse).body);

        // Strip out the previous content node if it's whitespace only
        omitLeft(body, i);
      }
      if (closeStandalone) {
        // Always strip the next node
        omitRight(body, i);

        omitLeft((current.inverse || current.program).body);
      }
    }

    return program;
  };
  WhitespaceControl.prototype.BlockStatement = function (block) {
    this.accept(block.program);
    this.accept(block.inverse);

    // Find the inverse program that is involed with whitespace stripping.
    var program = block.program || block.inverse,
        inverse = block.program && block.inverse,
        firstInverse = inverse,
        lastInverse = inverse;

    if (inverse && inverse.chained) {
      firstInverse = inverse.body[0].program;

      // Walk the inverse chain to find the last inverse that is actually in the chain.
      while (lastInverse.chained) {
        lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
      }
    }

    var strip = {
      open: block.openStrip.open,
      close: block.closeStrip.close,

      // Determine the standalone candiacy. Basically flag our content as being possibly standalone
      // so our parent can determine if we actually are standalone
      openStandalone: isNextWhitespace(program.body),
      closeStandalone: isPrevWhitespace((firstInverse || program).body)
    };

    if (block.openStrip.close) {
      omitRight(program.body, null, true);
    }

    if (inverse) {
      var inverseStrip = block.inverseStrip;

      if (inverseStrip.open) {
        omitLeft(program.body, null, true);
      }

      if (inverseStrip.close) {
        omitRight(firstInverse.body, null, true);
      }
      if (block.closeStrip.open) {
        omitLeft(lastInverse.body, null, true);
      }

      // Find standalone else statments
      if (isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
        omitLeft(program.body);
        omitRight(firstInverse.body);
      }
    } else if (block.closeStrip.open) {
      omitLeft(program.body, null, true);
    }

    return strip;
  };

  WhitespaceControl.prototype.MustacheStatement = function (mustache) {
    return mustache.strip;
  };

  WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function (node) {
    /* istanbul ignore next */
    var strip = node.strip || {};
    return {
      inlineStandalone: true,
      open: strip.open,
      close: strip.close
    };
  };

  function isPrevWhitespace(body, i, isRoot) {
    if (i === undefined) {
      i = body.length;
    }

    // Nodes that end with newlines are considered whitespace (but are special
    // cased for strip operations)
    var prev = body[i - 1],
        sibling = body[i - 2];
    if (!prev) {
      return isRoot;
    }

    if (prev.type === 'ContentStatement') {
      return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
    }
  }
  function isNextWhitespace(body, i, isRoot) {
    if (i === undefined) {
      i = -1;
    }

    var next = body[i + 1],
        sibling = body[i + 2];
    if (!next) {
      return isRoot;
    }

    if (next.type === 'ContentStatement') {
      return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
    }
  }

  // Marks the node to the right of the position as omitted.
  // I.e. {{foo}}' ' will mark the ' ' node as omitted.
  //
  // If i is undefined, then the first child will be marked as such.
  //
  // If mulitple is truthy then all whitespace will be stripped out until non-whitespace
  // content is met.
  function omitRight(body, i, multiple) {
    var current = body[i == null ? 0 : i + 1];
    if (!current || current.type !== 'ContentStatement' || !multiple && current.rightStripped) {
      return;
    }

    var original = current.value;
    current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, '');
    current.rightStripped = current.value !== original;
  }

  // Marks the node to the left of the position as omitted.
  // I.e. ' '{{foo}} will mark the ' ' node as omitted.
  //
  // If i is undefined then the last child will be marked as such.
  //
  // If mulitple is truthy then all whitespace will be stripped out until non-whitespace
  // content is met.
  function omitLeft(body, i, multiple) {
    var current = body[i == null ? body.length - 1 : i - 1];
    if (!current || current.type !== 'ContentStatement' || !multiple && current.leftStripped) {
      return;
    }

    // We omit the last node if it's whitespace only and not preceeded by a non-content node.
    var original = current.value;
    current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, '');
    current.leftStripped = current.value !== original;
    return current.leftStripped;
  }

  exports['default'] = WhitespaceControl;

});
enifed('htmlbars-syntax/handlebars/exception', ['exports'], function (exports) {

  'use strict';


  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  function Exception(message, node) {
    var loc = node && node.loc,
        line = undefined,
        column = undefined;
    if (loc) {
      line = loc.start.line;
      column = loc.start.column;

      message += ' - ' + line + ':' + column;
    }

    var tmp = Error.prototype.constructor.call(this, message);

    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Exception);
    }

    if (loc) {
      this.lineNumber = line;
      this.column = column;
    }
  }

  Exception.prototype = new Error();

  exports['default'] = Exception;

});
enifed('htmlbars-syntax/handlebars/safe-string', ['exports'], function (exports) {

  'use strict';

  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
    return '' + this.string;
  };

  exports['default'] = SafeString;

});
enifed('htmlbars-syntax/handlebars/utils', ['exports'], function (exports) {

  'use strict';

  exports.extend = extend;
  exports.indexOf = indexOf;
  exports.escapeExpression = escapeExpression;
  exports.isEmpty = isEmpty;
  exports.blockParams = blockParams;
  exports.appendContextPath = appendContextPath;

  var escape = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '`': '&#x60;'
  };

  var badChars = /[&<>"'`]/g,
      possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr];
  }
  function extend(obj /* , ...source */) {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          obj[key] = arguments[i][key];
        }
      }
    }

    return obj;
  }

  var toString = Object.prototype.toString;

  var isFunction = function (value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  /* istanbul ignore next */
  if (isFunction(/x/)) {
    isFunction = function (value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  var isArray = Array.isArray || function (value) {
    return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
  };function indexOf(array, value) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  }

  function escapeExpression(string) {
    if (typeof string !== 'string') {
      // don't escape SafeStrings, since they're already safe
      if (string && string.toHTML) {
        return string.toHTML();
      } else if (string == null) {
        return '';
      } else if (!string) {
        return string + '';
      }

      // Force a string conversion as this will be done by the append regardless and
      // the regex test will do this transparently behind the scenes, causing issues if
      // an object's to string has escaped characters in it.
      string = '' + string;
    }

    if (!possible.test(string)) {
      return string;
    }
    return string.replace(badChars, escapeChar);
  }

  function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  function blockParams(params, ids) {
    params.path = ids;
    return params;
  }

  function appendContextPath(contextPath, id) {
    return (contextPath ? contextPath + '.' : '') + id;
  }

  exports.toString = toString;
  exports.isFunction = isFunction;
  exports.isArray = isArray;

});
enifed('htmlbars-syntax/node-handlers', ['exports', './builders', '../htmlbars-util/array-utils', './utils'], function (exports, builders, array_utils, utils) {

  'use strict';

  var nodeHandlers = {

    Program: function (program) {
      var body = [];
      var node = builders.buildProgram(body, program.blockParams, program.loc);
      var i,
          l = program.body.length;

      this.elementStack.push(node);

      if (l === 0) {
        return this.elementStack.pop();
      }

      for (i = 0; i < l; i++) {
        this.acceptNode(program.body[i]);
      }

      this.acceptToken(this.tokenizer.tokenizeEOF());

      // Ensure that that the element stack is balanced properly.
      var poppedNode = this.elementStack.pop();
      if (poppedNode !== node) {
        throw new Error("Unclosed element `" + poppedNode.tag + "` (on line " + poppedNode.loc.start.line + ").");
      }

      return node;
    },

    BlockStatement: function (block) {
      delete block.inverseStrip;
      delete block.openString;
      delete block.closeStrip;

      if (this.tokenizer.state === "comment") {
        this.tokenizer.addChar("{{" + this.sourceForMustache(block) + "}}");
        return;
      }

      switchToHandlebars(this);
      this.acceptToken(block);

      block = acceptCommonNodes(this, block);
      var program = block.program ? this.acceptNode(block.program) : null;
      var inverse = block.inverse ? this.acceptNode(block.inverse) : null;

      var node = builders.buildBlock(block.path, block.params, block.hash, program, inverse);
      var parentProgram = this.currentElement();
      utils.appendChild(parentProgram, node);
    },

    MustacheStatement: function (mustache) {
      delete mustache.strip;

      if (this.tokenizer.state === "comment") {
        this.tokenizer.addChar("{{" + this.sourceForMustache(mustache) + "}}");
        return;
      }

      acceptCommonNodes(this, mustache);
      switchToHandlebars(this);
      this.acceptToken(mustache);

      return mustache;
    },

    ContentStatement: function (content) {
      var changeLines = 0;
      if (content.rightStripped) {
        changeLines = leadingNewlineDifference(content.original, content.value);
      }

      this.tokenizer.line = this.tokenizer.line + changeLines;

      var tokens = this.tokenizer.tokenizePart(content.value);

      return array_utils.forEach(tokens, this.acceptToken, this);
    },

    CommentStatement: function (comment) {
      return comment;
    },

    PartialStatement: function (partial) {
      utils.appendChild(this.currentElement(), partial);
      return partial;
    },

    SubExpression: function (sexpr) {
      return acceptCommonNodes(this, sexpr);
    },

    PathExpression: function (path) {
      delete path.data;
      delete path.depth;

      return path;
    },

    Hash: function (hash) {
      for (var i = 0; i < hash.pairs.length; i++) {
        this.acceptNode(hash.pairs[i].value);
      }

      return hash;
    },

    StringLiteral: function () {},
    BooleanLiteral: function () {},
    NumberLiteral: function () {},
    UndefinedLiteral: function () {},
    NullLiteral: function () {}
  };

  function switchToHandlebars(processor) {
    var token = processor.tokenizer.token;

    if (token && token.type === "Chars") {
      processor.acceptToken(token);
      processor.tokenizer.token = null;
    }
  }

  function leadingNewlineDifference(original, value) {
    if (value === "") {
      // if it is empty, just return the count of newlines
      // in original
      return original.split("\n").length - 1;
    }

    // otherwise, return the number of newlines prior to
    // `value`
    var difference = original.split(value)[0];
    var lines = difference.split(/\n/);

    return lines.length - 1;
  }

  function acceptCommonNodes(compiler, node) {
    compiler.acceptNode(node.path);

    if (node.params) {
      for (var i = 0; i < node.params.length; i++) {
        compiler.acceptNode(node.params[i]);
      }
    } else {
      node.params = [];
    }

    if (node.hash) {
      compiler.acceptNode(node.hash);
    } else {
      node.hash = builders.buildHash();
    }

    return node;
  }

  exports['default'] = nodeHandlers;

});
enifed('htmlbars-syntax/parser', ['exports', './handlebars/compiler/base', './tokenizer', '../simple-html-tokenizer/entity-parser', '../simple-html-tokenizer/char-refs/full', './node-handlers', './token-handlers', '../htmlbars-syntax'], function (exports, base, tokenizer, EntityParser, fullCharRefs, nodeHandlers, tokenHandlers, syntax) {

  'use strict';

  exports.preprocess = preprocess;

  var splitLines;
  // IE8 throws away blank pieces when splitting strings with a regex
  // So we split using a string instead as appropriate
  if ("foo\n\nbar".split(/\n/).length === 2) {
    splitLines = function (str) {
      var clean = str.replace(/\r\n?/g, "\n");
      return clean.split("\n");
    };
  } else {
    splitLines = function (str) {
      return str.split(/(?:\r\n?|\n)/g);
    };
  }
  function preprocess(html, options) {
    var ast = typeof html === "object" ? html : base.parse(html);
    var combined = new HTMLProcessor(html, options).acceptNode(ast);

    if (options && options.plugins && options.plugins.ast) {
      for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
        var plugin = new options.plugins.ast[i](options);

        plugin.syntax = syntax;

        combined = plugin.transform(combined);
      }
    }

    return combined;
  }

  exports['default'] = preprocess;

  function HTMLProcessor(source, options) {
    this.options = options || {};
    this.elementStack = [];
    this.tokenizer = new tokenizer.Tokenizer("", new EntityParser['default'](fullCharRefs['default']));
    this.nodeHandlers = nodeHandlers['default'];
    this.tokenHandlers = tokenHandlers['default'];

    if (typeof source === "string") {
      this.source = splitLines(source);
    }
  }

  HTMLProcessor.prototype.acceptNode = function (node) {
    return this.nodeHandlers[node.type].call(this, node);
  };

  HTMLProcessor.prototype.acceptToken = function (token) {
    if (token) {
      return this.tokenHandlers[token.type].call(this, token);
    }
  };

  HTMLProcessor.prototype.currentElement = function () {
    return this.elementStack[this.elementStack.length - 1];
  };

  HTMLProcessor.prototype.sourceForMustache = function (mustache) {
    var firstLine = mustache.loc.start.line - 1;
    var lastLine = mustache.loc.end.line - 1;
    var currentLine = firstLine - 1;
    var firstColumn = mustache.loc.start.column + 2;
    var lastColumn = mustache.loc.end.column - 2;
    var string = [];
    var line;

    if (!this.source) {
      return "{{" + mustache.path.id.original + "}}";
    }

    while (currentLine < lastLine) {
      currentLine++;
      line = this.source[currentLine];

      if (currentLine === firstLine) {
        if (firstLine === lastLine) {
          string.push(line.slice(firstColumn, lastColumn));
        } else {
          string.push(line.slice(firstColumn));
        }
      } else if (currentLine === lastLine) {
        string.push(line.slice(0, lastColumn));
      } else {
        string.push(line);
      }
    }

    return string.join("\n");
  };

});
enifed('htmlbars-syntax/token-handlers', ['exports', '../htmlbars-util/array-utils', './builders', './utils'], function (exports, array_utils, builders, utils) {

  'use strict';

  var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
  var voidMap = {};

  array_utils.forEach(voidTagNames.split(" "), function (tagName) {
    voidMap[tagName] = true;
  });

  // Except for `mustache`, all tokens are only allowed outside of
  // a start or end tag.
  var tokenHandlers = {
    Comment: function (token) {
      var current = this.currentElement();
      var comment = builders.buildComment(token.chars);
      utils.appendChild(current, comment);
    },

    Chars: function (token) {
      var current = this.currentElement();
      var text = builders.buildText(token.chars);
      utils.appendChild(current, text);
    },

    StartTag: function (tag) {
      var element = builders.buildElement(tag.tagName, tag.attributes, tag.modifiers || [], []);
      element.loc = {
        start: { line: tag.firstLine, column: tag.firstColumn },
        end: { line: null, column: null }
      };

      this.elementStack.push(element);
      if (voidMap.hasOwnProperty(tag.tagName) || tag.selfClosing) {
        tokenHandlers.EndTag.call(this, tag, true);
      }
    },

    BlockStatement: function () {
      if (this.tokenizer.state === "comment") {
        return;
      } else if (this.tokenizer.state !== "data") {
        throw new Error("A block may only be used inside an HTML element or another block.");
      }
    },

    MustacheStatement: function (mustache) {
      var tokenizer = this.tokenizer;

      switch (tokenizer.state) {
        // Tag helpers
        case "tagName":
          tokenizer.addElementModifier(mustache);
          tokenizer.state = "beforeAttributeName";
          return;
        case "beforeAttributeName":
          tokenizer.addElementModifier(mustache);
          return;
        case "attributeName":
        case "afterAttributeName":
          tokenizer.finalizeAttributeValue();
          tokenizer.addElementModifier(mustache);
          tokenizer.state = "beforeAttributeName";
          return;
        case "afterAttributeValueQuoted":
          tokenizer.addElementModifier(mustache);
          tokenizer.state = "beforeAttributeName";
          return;

        // Attribute values
        case "beforeAttributeValue":
          tokenizer.markAttributeQuoted(false);
          tokenizer.addToAttributeValue(mustache);
          tokenizer.state = "attributeValueUnquoted";
          return;
        case "attributeValueDoubleQuoted":
        case "attributeValueSingleQuoted":
        case "attributeValueUnquoted":
          tokenizer.addToAttributeValue(mustache);
          return;

        // TODO: Only append child when the tokenizer state makes
        // sense to do so, otherwise throw an error.
        default:
          utils.appendChild(this.currentElement(), mustache);
      }
    },

    EndTag: function (tag, selfClosing) {
      var element = this.elementStack.pop();
      var parent = this.currentElement();
      var disableComponentGeneration = this.options.disableComponentGeneration === true;

      validateEndTag(tag, element, selfClosing);

      if (disableComponentGeneration || element.tag.indexOf("-") === -1) {
        utils.appendChild(parent, element);
      } else {
        var program = builders.buildProgram(element.children);
        utils.parseComponentBlockParams(element, program);
        var component = builders.buildComponent(element.tag, element.attributes, program);
        utils.appendChild(parent, component);
      }
    }

  };

  function validateEndTag(tag, element, selfClosing) {
    var error;

    if (voidMap[tag.tagName] && !selfClosing) {
      // EngTag is also called by StartTag for void and self-closing tags (i.e.
      // <input> or <br />, so we need to check for that here. Otherwise, we would
      // throw an error for those cases.
      error = "Invalid end tag " + formatEndTagInfo(tag) + " (void elements cannot have end tags).";
    } else if (element.tag === undefined) {
      error = "Closing tag " + formatEndTagInfo(tag) + " without an open tag.";
    } else if (element.tag !== tag.tagName) {
      error = "Closing tag " + formatEndTagInfo(tag) + " did not match last open tag `" + element.tag + "` (on line " + element.loc.start.line + ").";
    }

    if (error) {
      throw new Error(error);
    }
  }

  function formatEndTagInfo(tag) {
    return "`" + tag.tagName + "` (on line " + tag.lastLine + ")";
  }

  exports['default'] = tokenHandlers;
  /*block*/

});
enifed('htmlbars-syntax/tokenizer', ['exports', '../simple-html-tokenizer', './utils', '../htmlbars-util/array-utils', './builders'], function (exports, simple_html_tokenizer, utils, array_utils, builders) {

  'use strict';

  simple_html_tokenizer.Tokenizer.prototype.createAttribute = function (char) {
    if (this.token.type === "EndTag") {
      throw new Error("Invalid end tag: closing tag must not have attributes, in " + formatTokenInfo(this) + ".");
    }
    this.currentAttribute = builders['default'].attr(char.toLowerCase(), [], null);
    this.token.attributes.push(this.currentAttribute);
    this.state = "attributeName";
  };

  simple_html_tokenizer.Tokenizer.prototype.markAttributeQuoted = function (value) {
    this.currentAttribute.quoted = value;
  };

  simple_html_tokenizer.Tokenizer.prototype.addToAttributeName = function (char) {
    this.currentAttribute.name += char;
  };

  simple_html_tokenizer.Tokenizer.prototype.addToAttributeValue = function (char) {
    var value = this.currentAttribute.value;

    if (!this.currentAttribute.quoted && char === "/") {
      throw new Error("A space is required between an unquoted attribute value and `/`, in " + formatTokenInfo(this) + ".");
    }
    if (!this.currentAttribute.quoted && value.length > 0 && (char.type === "MustacheStatement" || value[0].type === "MustacheStatement")) {
      throw new Error("Unquoted attribute value must be a single string or mustache (on line " + this.line + ")");
    }

    if (typeof char === "object") {
      if (char.type === "MustacheStatement") {
        value.push(char);
      } else {
        throw new Error("Unsupported node in attribute value: " + char.type);
      }
    } else {
      if (value.length > 0 && value[value.length - 1].type === "TextNode") {
        value[value.length - 1].chars += char;
      } else {
        value.push(builders['default'].text(char));
      }
    }
  };

  simple_html_tokenizer.Tokenizer.prototype.finalizeAttributeValue = function () {
    if (this.currentAttribute) {
      this.currentAttribute.value = prepareAttributeValue(this.currentAttribute);
      delete this.currentAttribute.quoted;
      delete this.currentAttribute;
    }
  };

  simple_html_tokenizer.Tokenizer.prototype.addElementModifier = function (mustache) {
    if (!this.token.modifiers) {
      this.token.modifiers = [];
    }

    var modifier = builders['default'].elementModifier(mustache.path, mustache.params, mustache.hash);
    this.token.modifiers.push(modifier);
  };

  function prepareAttributeValue(attr) {
    var parts = attr.value;
    var length = parts.length;

    if (length === 0) {
      return builders['default'].text("");
    } else if (length === 1 && parts[0].type === "TextNode") {
      return parts[0];
    } else if (!attr.quoted) {
      return parts[0];
    } else {
      return builders['default'].concat(array_utils.map(parts, prepareConcatPart));
    }
  }

  function prepareConcatPart(node) {
    switch (node.type) {
      case "TextNode":
        return builders['default'].string(node.chars);
      case "MustacheStatement":
        return utils.unwrapMustache(node);
      default:
        throw new Error("Unsupported node in quoted attribute value: " + node.type);
    }
  }

  function formatTokenInfo(tokenizer) {
    return "`" + tokenizer.token.tagName + "` (on line " + tokenizer.line + ")";
  }

  exports.Tokenizer = simple_html_tokenizer.Tokenizer;

});
enifed('htmlbars-syntax/utils', ['exports', '../htmlbars-util/array-utils'], function (exports, array_utils) {

  'use strict';

  exports.parseComponentBlockParams = parseComponentBlockParams;
  exports.childrenFor = childrenFor;
  exports.appendChild = appendChild;
  exports.isHelper = isHelper;
  exports.unwrapMustache = unwrapMustache;

  // Checks the component's attributes to see if it uses block params.
  // If it does, registers the block params with the program and
  // removes the corresponding attributes from the element.

  var ID_INVERSE_PATTERN = /[!"#%-,\.\/;->@\[-\^`\{-~]/;
  function parseComponentBlockParams(element, program) {
    var l = element.attributes.length;
    var attrNames = [];

    for (var i = 0; i < l; i++) {
      attrNames.push(element.attributes[i].name);
    }

    var asIndex = array_utils.indexOfArray(attrNames, 'as');

    if (asIndex !== -1 && l > asIndex && attrNames[asIndex + 1].charAt(0) === '|') {
      // Some basic validation, since we're doing the parsing ourselves
      var paramsString = attrNames.slice(asIndex).join(' ');
      if (paramsString.charAt(paramsString.length - 1) !== '|' || paramsString.match(/\|/g).length !== 2) {
        throw new Error('Invalid block parameters syntax: \'' + paramsString + '\'');
      }

      var params = [];
      for (i = asIndex + 1; i < l; i++) {
        var param = attrNames[i].replace(/\|/g, '');
        if (param !== '') {
          if (ID_INVERSE_PATTERN.test(param)) {
            throw new Error('Invalid identifier for block parameters: \'' + param + '\' in \'' + paramsString + '\'');
          }
          params.push(param);
        }
      }

      if (params.length === 0) {
        throw new Error('Cannot use zero block parameters: \'' + paramsString + '\'');
      }

      element.attributes = element.attributes.slice(0, asIndex);
      program.blockParams = params;
    }
  }

  function childrenFor(node) {
    if (node.type === 'Program') {
      return node.body;
    }
    if (node.type === 'ElementNode') {
      return node.children;
    }
  }

  function appendChild(parent, node) {
    childrenFor(parent).push(node);
  }

  function isHelper(mustache) {
    return mustache.params && mustache.params.length > 0 || mustache.hash && mustache.hash.pairs.length > 0;
  }

  function unwrapMustache(mustache) {
    if (isHelper(mustache)) {
      return mustache;
    } else {
      return mustache.path;
    }
  }

});
enifed('htmlbars-syntax/walker', ['exports'], function (exports) {

  'use strict';

  function Walker(order) {
    this.order = order;
    this.stack = [];
  }

  exports['default'] = Walker;

  Walker.prototype.visit = function (node, callback) {
    if (!node) {
      return;
    }

    this.stack.push(node);

    if (this.order === 'post') {
      this.children(node, callback);
      callback(node, this);
    } else {
      callback(node, this);
      this.children(node, callback);
    }

    this.stack.pop();
  };

  var visitors = {
    Program: function (walker, node, callback) {
      for (var i = 0; i < node.body.length; i++) {
        walker.visit(node.body[i], callback);
      }
    },

    ElementNode: function (walker, node, callback) {
      for (var i = 0; i < node.children.length; i++) {
        walker.visit(node.children[i], callback);
      }
    },

    BlockStatement: function (walker, node, callback) {
      walker.visit(node.program, callback);
      walker.visit(node.inverse, callback);
    },

    ComponentNode: function (walker, node, callback) {
      walker.visit(node.program, callback);
    }
  };

  Walker.prototype.children = function (node, callback) {
    var visitor = visitors[node.type];
    if (visitor) {
      visitor(this, node, callback);
    }
  };

});
enifed('htmlbars-test-helpers', ['exports', '../simple-html-tokenizer', '../htmlbars-util/array-utils'], function (exports, simple_html_tokenizer, array_utils) {

  'use strict';

  exports.equalInnerHTML = equalInnerHTML;
  exports.equalHTML = equalHTML;
  exports.equalTokens = equalTokens;
  exports.normalizeInnerHTML = normalizeInnerHTML;
  exports.isCheckedInputHTML = isCheckedInputHTML;
  exports.getTextContent = getTextContent;
  exports.createObject = createObject;

  function equalInnerHTML(fragment, html) {
    var actualHTML = normalizeInnerHTML(fragment.innerHTML);
    QUnit.push(actualHTML === html, actualHTML, html);
  }

  function equalHTML(node, html) {
    var fragment;
    if (!node.nodeType && node.length) {
      fragment = document.createDocumentFragment();
      while (node[0]) {
        fragment.appendChild(node[0]);
      }
    } else {
      fragment = node;
    }

    var div = document.createElement("div");
    div.appendChild(fragment.cloneNode(true));

    equalInnerHTML(div, html);
  }

  // IE8 removes comments and does other unspeakable things with innerHTML
  var ie8GenerateTokensNeeded = (function () {
    var div = document.createElement("div");
    div.innerHTML = "<!-- foobar -->";
    return div.innerHTML === "";
  })();

  function generateTokens(fragmentOrHtml) {
    var div = document.createElement("div");
    if (typeof fragmentOrHtml === "string") {
      div.innerHTML = fragmentOrHtml;
    } else {
      div.appendChild(fragmentOrHtml.cloneNode(true));
    }
    if (ie8GenerateTokensNeeded) {
      // IE8 drops comments and does other unspeakable things on `innerHTML`.
      // So in that case we do it to both the expected and actual so that they match.
      var div2 = document.createElement("div");
      div2.innerHTML = div.innerHTML;
      div.innerHTML = div2.innerHTML;
    }
    return { tokens: simple_html_tokenizer.tokenize(div.innerHTML), html: div.innerHTML };
  }
  function equalTokens(fragment, html, message) {
    if (fragment.fragment) {
      fragment = fragment.fragment;
    }
    if (html.fragment) {
      html = html.fragment;
    }

    var fragTokens = generateTokens(fragment);
    var htmlTokens = generateTokens(html);

    function normalizeTokens(token) {
      if (token.type === "StartTag") {
        token.attributes = token.attributes.sort(function (a, b) {
          if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }
          return 0;
        });
      }
    }

    array_utils.forEach(fragTokens.tokens, normalizeTokens);
    array_utils.forEach(htmlTokens.tokens, normalizeTokens);

    var msg = "Expected: " + html + "; Actual: " + fragTokens.html;

    if (message) {
      msg += " (" + message + ")";
    }

    deepEqual(fragTokens.tokens, htmlTokens.tokens, msg);
  }

  // detect weird IE8 html strings
  var ie8InnerHTMLTestElement = document.createElement("div");
  ie8InnerHTMLTestElement.setAttribute("id", "womp");
  var ie8InnerHTML = ie8InnerHTMLTestElement.outerHTML.indexOf("id=womp") > -1;

  // detect side-effects of cloning svg elements in IE9-11
  var ieSVGInnerHTML = (function () {
    if (!document.createElementNS) {
      return false;
    }
    var div = document.createElement("div");
    var node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    div.appendChild(node);
    var clone = div.cloneNode(true);
    return clone.innerHTML === "<svg xmlns=\"http://www.w3.org/2000/svg\" />";
  })();
  function normalizeInnerHTML(actualHTML) {
    if (ie8InnerHTML) {
      // drop newlines in IE8
      actualHTML = actualHTML.replace(/\r\n/gm, "");
      // downcase ALLCAPS tags in IE8
      actualHTML = actualHTML.replace(/<\/?[A-Z\-]+/gi, function (tag) {
        return tag.toLowerCase();
      });
      // quote ids in IE8
      actualHTML = actualHTML.replace(/id=([^ >]+)/gi, function (match, id) {
        return "id=\"" + id + "\"";
      });
      // IE8 adds ':' to some tags
      // <keygen> becomes <:keygen>
      actualHTML = actualHTML.replace(/<(\/?):([^ >]+)/gi, function (match, slash, tag) {
        return "<" + slash + tag;
      });

      // Normalize the style attribute
      actualHTML = actualHTML.replace(/style="(.+?)"/gi, function (match, val) {
        return "style=\"" + val.toLowerCase() + ";\"";
      });
    }
    if (ieSVGInnerHTML) {
      // Replace `<svg xmlns="http://www.w3.org/2000/svg" height="50%" />` with `<svg height="50%"></svg>`, etc.
      // drop namespace attribute
      actualHTML = actualHTML.replace(/ xmlns="[^"]+"/, "");
      // replace self-closing elements
      actualHTML = actualHTML.replace(/<([^ >]+) [^\/>]*\/>/gi, function (tag, tagName) {
        return tag.slice(0, tag.length - 3) + "></" + tagName + ">";
      });
    }

    return actualHTML;
  }

  // detect weird IE8 checked element string
  var checkedInput = document.createElement("input");
  checkedInput.setAttribute("checked", "checked");
  var checkedInputString = checkedInput.outerHTML;
  function isCheckedInputHTML(element) {
    equal(element.outerHTML, checkedInputString);
  }

  // check which property has the node's text content
  var textProperty = document.createElement("div").textContent === undefined ? "innerText" : "textContent";
  function getTextContent(el) {
    // textNode
    if (el.nodeType === 3) {
      return el.nodeValue;
    } else {
      return el[textProperty];
    }
  }

  function createObject(obj) {
    if (typeof Object.create === "function") {
      return Object.create(obj);
    } else {
      var Temp = function () {};
      Temp.prototype = obj;
      return new Temp();
    }
  }

});
enifed('htmlbars-util', ['exports', './htmlbars-util/safe-string', './htmlbars-util/handlebars/utils', './htmlbars-util/namespaces', './htmlbars-util/morph-utils'], function (exports, SafeString, utils, namespaces, morph_utils) {

  'use strict';



  exports.SafeString = SafeString['default'];
  exports.escapeExpression = utils.escapeExpression;
  exports.getAttrNamespace = namespaces.getAttrNamespace;
  exports.validateChildMorphs = morph_utils.validateChildMorphs;
  exports.linkParams = morph_utils.linkParams;
  exports.dump = morph_utils.dump;

});
enifed('htmlbars-util/array-utils', ['exports'], function (exports) {

  'use strict';

  exports.forEach = forEach;
  exports.map = map;

  function forEach(array, callback, binding) {
    var i, l;
    if (binding === undefined) {
      for (i = 0, l = array.length; i < l; i++) {
        callback(array[i], i, array);
      }
    } else {
      for (i = 0, l = array.length; i < l; i++) {
        callback.call(binding, array[i], i, array);
      }
    }
  }

  function map(array, callback) {
    var output = [];
    var i, l;

    for (i = 0, l = array.length; i < l; i++) {
      output.push(callback(array[i], i, array));
    }

    return output;
  }

  var getIdx;
  if (Array.prototype.indexOf) {
    getIdx = function (array, obj, from) {
      return array.indexOf(obj, from);
    };
  } else {
    getIdx = function (array, obj, from) {
      if (from === undefined || from === null) {
        from = 0;
      } else if (from < 0) {
        from = Math.max(0, array.length + from);
      }
      for (var i = from, l = array.length; i < l; i++) {
        if (array[i] === obj) {
          return i;
        }
      }
      return -1;
    };
  }

  var indexOfArray = getIdx;

  exports.indexOfArray = indexOfArray;

});
enifed('htmlbars-util/handlebars/safe-string', ['exports'], function (exports) {

  'use strict';

  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
    return '' + this.string;
  };

  exports['default'] = SafeString;

});
enifed('htmlbars-util/handlebars/utils', ['exports'], function (exports) {

  'use strict';

  exports.extend = extend;
  exports.indexOf = indexOf;
  exports.escapeExpression = escapeExpression;
  exports.isEmpty = isEmpty;
  exports.blockParams = blockParams;
  exports.appendContextPath = appendContextPath;

  var escape = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '`': '&#x60;'
  };

  var badChars = /[&<>"'`]/g,
      possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr];
  }
  function extend(obj /* , ...source */) {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          obj[key] = arguments[i][key];
        }
      }
    }

    return obj;
  }

  var toString = Object.prototype.toString;

  var isFunction = function (value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  /* istanbul ignore next */
  if (isFunction(/x/)) {
    isFunction = function (value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  var isArray = Array.isArray || function (value) {
    return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
  };function indexOf(array, value) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  }

  function escapeExpression(string) {
    if (typeof string !== 'string') {
      // don't escape SafeStrings, since they're already safe
      if (string && string.toHTML) {
        return string.toHTML();
      } else if (string == null) {
        return '';
      } else if (!string) {
        return string + '';
      }

      // Force a string conversion as this will be done by the append regardless and
      // the regex test will do this transparently behind the scenes, causing issues if
      // an object's to string has escaped characters in it.
      string = '' + string;
    }

    if (!possible.test(string)) {
      return string;
    }
    return string.replace(badChars, escapeChar);
  }

  function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  function blockParams(params, ids) {
    params.path = ids;
    return params;
  }

  function appendContextPath(contextPath, id) {
    return (contextPath ? contextPath + '.' : '') + id;
  }

  exports.toString = toString;
  exports.isFunction = isFunction;
  exports.isArray = isArray;

});
enifed('htmlbars-util/morph-utils', ['exports'], function (exports) {

  'use strict';

  exports.visitChildren = visitChildren;
  exports.validateChildMorphs = validateChildMorphs;
  exports.linkParams = linkParams;
  exports.dump = dump;

  /*globals console*/

  function visitChildren(nodes, callback) {
    if (!nodes || nodes.length === 0) {
      return;
    }

    nodes = nodes.slice();

    while (nodes.length) {
      var node = nodes.pop();
      callback(node);

      if (node.childNodes) {
        nodes.push.apply(nodes, node.childNodes);
      } else if (node.firstChildMorph) {
        var current = node.firstChildMorph;

        while (current) {
          nodes.push(current);
          current = current.nextMorph;
        }
      } else if (node.morphList) {
        nodes.push(node.morphList);
      }
    }
  }

  function validateChildMorphs(env, morph, visitor) {
    var morphList = morph.morphList;
    if (morph.morphList) {
      var current = morphList.firstChildMorph;

      while (current) {
        var next = current.nextMorph;
        validateChildMorphs(env, current, visitor);
        current = next;
      }
    } else if (morph.lastResult) {
      morph.lastResult.revalidateWith(env, undefined, undefined, undefined, visitor);
    } else if (morph.childNodes) {
      // This means that the childNodes were wired up manually
      for (var i = 0, l = morph.childNodes.length; i < l; i++) {
        validateChildMorphs(env, morph.childNodes[i], visitor);
      }
    }
  }

  function linkParams(env, scope, morph, path, params, hash) {
    if (morph.linkedParams) {
      return;
    }

    if (env.hooks.linkRenderNode(morph, env, scope, path, params, hash)) {
      morph.linkedParams = { params: params, hash: hash };
    }
  }

  function dump(node) {
    console.group(node, node.isDirty);

    if (node.childNodes) {
      map(node.childNodes, dump);
    } else if (node.firstChildMorph) {
      var current = node.firstChildMorph;

      while (current) {
        dump(current);
        current = current.nextMorph;
      }
    } else if (node.morphList) {
      dump(node.morphList);
    }

    console.groupEnd();
  }

  function map(nodes, cb) {
    for (var i = 0, l = nodes.length; i < l; i++) {
      cb(nodes[i]);
    }
  }

});
enifed('htmlbars-util/namespaces', ['exports'], function (exports) {

  'use strict';

  exports.getAttrNamespace = getAttrNamespace;

  var defaultNamespaces = {
    html: 'http://www.w3.org/1999/xhtml',
    mathml: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace'
  };
  function getAttrNamespace(attrName) {
    var namespace;

    var colonIndex = attrName.indexOf(':');
    if (colonIndex !== -1) {
      var prefix = attrName.slice(0, colonIndex);
      namespace = defaultNamespaces[prefix];
    }

    return namespace || null;
  }

});
enifed('htmlbars-util/object-utils', ['exports'], function (exports) {

  'use strict';

  exports.merge = merge;
  exports.createObject = createObject;
  exports.objectKeys = objectKeys;
  exports.shallowCopy = shallowCopy;
  exports.keySet = keySet;
  exports.keyLength = keyLength;

  function merge(options, defaults) {
    for (var prop in defaults) {
      if (options.hasOwnProperty(prop)) {
        continue;
      }
      options[prop] = defaults[prop];
    }
    return options;
  }

  function createObject(obj) {
    if (typeof Object.create === 'function') {
      return Object.create(obj);
    } else {
      var Temp = function () {};
      Temp.prototype = obj;
      return new Temp();
    }
  }

  function objectKeys(obj) {
    if (typeof Object.keys === 'function') {
      return Object.keys(obj);
    } else {
      return legacyKeys(obj);
    }
  }

  function shallowCopy(obj) {
    return merge({}, obj);
  }

  function legacyKeys(obj) {
    var keys = [];

    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        keys.push(prop);
      }
    }

    return keys;
  }
  function keySet(obj) {
    var set = {};

    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        set[prop] = true;
      }
    }

    return set;
  }

  function keyLength(obj) {
    var count = 0;

    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        count++;
      }
    }

    return count;
  }

});
enifed('htmlbars-util/quoting', ['exports'], function (exports) {

  'use strict';

  exports.hash = hash;
  exports.repeat = repeat;
  exports.escapeString = escapeString;
  exports.string = string;
  exports.array = array;

  function escapeString(str) {
    str = str.replace(/\\/g, "\\\\");
    str = str.replace(/"/g, "\\\"");
    str = str.replace(/\n/g, "\\n");
    return str;
  }

  function string(str) {
    return "\"" + escapeString(str) + "\"";
  }

  function array(a) {
    return "[" + a + "]";
  }

  function hash(pairs) {
    return "{" + pairs.join(", ") + "}";
  }

  function repeat(chars, times) {
    var str = "";
    while (times--) {
      str += chars;
    }
    return str;
  }

});
enifed('htmlbars-util/safe-string', ['exports', './handlebars/safe-string'], function (exports, SafeString) {

  'use strict';

  exports['default'] = SafeString['default'];

});
enifed('htmlbars-util/template-utils', ['exports', '../htmlbars-util/morph-utils'], function (exports, morph_utils) {

  'use strict';

  exports.blockFor = blockFor;
  exports.renderAndCleanup = renderAndCleanup;
  exports.clearMorph = clearMorph;

  function blockFor(render, template, blockOptions) {
    var block = function (env, blockArguments, self, renderNode, parentScope, visitor) {
      if (renderNode.lastResult) {
        renderNode.lastResult.revalidateWith(env, undefined, self, blockArguments, visitor);
      } else {
        var options = { renderState: { morphListStart: null, clearMorph: renderNode, shadowOptions: null } };

        var scope = blockOptions.scope;
        var shadowScope = scope ? env.hooks.createChildScope(scope) : env.hooks.createFreshScope();

        env.hooks.bindShadowScope(env, parentScope, shadowScope, blockOptions.options);

        if (self !== undefined) {
          env.hooks.bindSelf(env, shadowScope, self);
        } else if (blockOptions.self !== undefined) {
          env.hooks.bindSelf(env, shadowScope, blockOptions.self);
        }

        bindBlocks(env, shadowScope, blockOptions.yieldTo);

        renderAndCleanup(renderNode, env, options, null, function () {
          options.renderState.clearMorph = null;
          render(template, env, shadowScope, { renderNode: renderNode, blockArguments: blockArguments });
        });
      }
    };

    block.arity = template.arity;

    return block;
  }

  function bindBlocks(env, shadowScope, blocks) {
    if (!blocks) {
      return;
    }
    if (typeof blocks === 'function') {
      env.hooks.bindBlock(env, shadowScope, blocks);
    } else {
      for (var name in blocks) {
        if (blocks.hasOwnProperty(name)) {
          env.hooks.bindBlock(env, shadowScope, blocks[name], name);
        }
      }
    }
  }
  function renderAndCleanup(morph, env, options, shadowOptions, callback) {
    options.renderState.shadowOptions = shadowOptions;
    var result = callback(options);

    if (result && result.handled) {
      return;
    }

    var item = options.renderState.morphListStart;
    var toClear = options.renderState.clearMorph;
    var morphMap = morph.morphMap;

    while (item) {
      var next = item.nextMorph;
      delete morphMap[item.key];
      clearMorph(item, env, true);
      item.destroy();
      item = next;
    }

    if (toClear) {
      if (Object.prototype.toString.call(toClear) === '[object Array]') {
        for (var i = 0, l = toClear.length; i < l; i++) {
          clearMorph(toClear[i], env);
        }
      } else {
        clearMorph(toClear, env);
      }
    }
  }

  function clearMorph(morph, env, destroySelf) {
    var cleanup = env.hooks.cleanupRenderNode;
    var destroy = env.hooks.destroyRenderNode;
    var willCleanup = env.hooks.willCleanupTree;
    var didCleanup = env.hooks.didCleanupTree;

    function destroyNode(node) {
      if (cleanup) {
        cleanup(node);
      }
      if (destroy) {
        destroy(node);
      }
    }

    if (willCleanup) {
      willCleanup(env, morph, destroySelf);
    }
    if (cleanup) {
      cleanup(morph);
    }
    if (destroySelf && destroy) {
      destroy(morph);
    }

    morph_utils.visitChildren(morph.childNodes, destroyNode);

    // TODO: Deal with logical children that are not in the DOM tree
    morph.clear();
    if (didCleanup) {
      didCleanup(env, morph, destroySelf);
    }

    morph.lastResult = null;
    morph.lastYielded = null;
    morph.childNodes = null;
  }

});
enifed('morph-range', ['exports', './morph-range/utils'], function (exports, utils) {

  'use strict';

  function Morph(domHelper, contextualElement) {
    this.domHelper = domHelper;
    // context if content if current content is detached
    this.contextualElement = contextualElement;
    // inclusive range of morph
    // these should be nodeType 1, 3, or 8
    this.firstNode = null;
    this.lastNode = null;

    // flag to force text to setContent to be treated as html
    this.parseTextAsHTML = false;

    // morph list graph
    this.parentMorphList = null;
    this.previousMorph = null;
    this.nextMorph = null;
  }

  Morph.empty = function (domHelper, contextualElement) {
    var morph = new Morph(domHelper, contextualElement);
    morph.clear();
    return morph;
  };

  Morph.create = function (domHelper, contextualElement, node) {
    var morph = new Morph(domHelper, contextualElement);
    morph.setNode(node);
    return morph;
  };

  Morph.attach = function (domHelper, contextualElement, firstNode, lastNode) {
    var morph = new Morph(domHelper, contextualElement);
    morph.setRange(firstNode, lastNode);
    return morph;
  };

  Morph.prototype.setContent = function Morph$setContent(content) {
    if (content === null || content === undefined) {
      return this.clear();
    }

    var type = typeof content;
    switch (type) {
      case 'string':
        if (this.parseTextAsHTML) {
          return this.setHTML(content);
        }
        return this.setText(content);
      case 'object':
        if (typeof content.nodeType === 'number') {
          return this.setNode(content);
        }
        /* Handlebars.SafeString */
        if (typeof content.string === 'string') {
          return this.setHTML(content.string);
        }
        if (this.parseTextAsHTML) {
          return this.setHTML(content.toString());
        }
      /* falls through */
      case 'boolean':
      case 'number':
        return this.setText(content.toString());
      default:
        throw new TypeError('unsupported content');
    }
  };

  Morph.prototype.clear = function Morph$clear() {
    var node = this.setNode(this.domHelper.createComment(''));
    return node;
  };

  Morph.prototype.setText = function Morph$setText(text) {
    var firstNode = this.firstNode;
    var lastNode = this.lastNode;

    if (firstNode && lastNode === firstNode && firstNode.nodeType === 3) {
      firstNode.nodeValue = text;
      return firstNode;
    }

    return this.setNode(text ? this.domHelper.createTextNode(text) : this.domHelper.createComment(''));
  };

  Morph.prototype.setNode = function Morph$setNode(newNode) {
    var firstNode, lastNode;
    switch (newNode.nodeType) {
      case 3:
        firstNode = newNode;
        lastNode = newNode;
        break;
      case 11:
        firstNode = newNode.firstChild;
        lastNode = newNode.lastChild;
        if (firstNode === null) {
          firstNode = this.domHelper.createComment('');
          newNode.appendChild(firstNode);
          lastNode = firstNode;
        }
        break;
      default:
        firstNode = newNode;
        lastNode = newNode;
        break;
    }

    this.setRange(firstNode, lastNode);

    return newNode;
  };

  Morph.prototype.setRange = function (firstNode, lastNode) {
    var previousFirstNode = this.firstNode;
    if (previousFirstNode !== null) {

      var parentNode = previousFirstNode.parentNode;
      if (parentNode !== null) {
        utils.insertBefore(parentNode, firstNode, lastNode, previousFirstNode);
        utils.clear(parentNode, previousFirstNode, this.lastNode);
      }
    }

    this.firstNode = firstNode;
    this.lastNode = lastNode;

    if (this.parentMorphList) {
      this._syncFirstNode();
      this._syncLastNode();
    }
  };

  Morph.prototype.destroy = function Morph$destroy() {
    this.unlink();

    var firstNode = this.firstNode;
    var lastNode = this.lastNode;
    var parentNode = firstNode && firstNode.parentNode;

    this.firstNode = null;
    this.lastNode = null;

    utils.clear(parentNode, firstNode, lastNode);
  };

  Morph.prototype.unlink = function Morph$unlink() {
    var parentMorphList = this.parentMorphList;
    var previousMorph = this.previousMorph;
    var nextMorph = this.nextMorph;

    if (previousMorph) {
      if (nextMorph) {
        previousMorph.nextMorph = nextMorph;
        nextMorph.previousMorph = previousMorph;
      } else {
        previousMorph.nextMorph = null;
        parentMorphList.lastChildMorph = previousMorph;
      }
    } else {
      if (nextMorph) {
        nextMorph.previousMorph = null;
        parentMorphList.firstChildMorph = nextMorph;
      } else if (parentMorphList) {
        parentMorphList.lastChildMorph = parentMorphList.firstChildMorph = null;
      }
    }

    this.parentMorphList = null;
    this.nextMorph = null;
    this.previousMorph = null;

    if (parentMorphList && parentMorphList.mountedMorph) {
      if (!parentMorphList.firstChildMorph) {
        // list is empty
        parentMorphList.mountedMorph.clear();
        return;
      } else {
        parentMorphList.firstChildMorph._syncFirstNode();
        parentMorphList.lastChildMorph._syncLastNode();
      }
    }
  };

  Morph.prototype.setHTML = function (text) {
    var fragment = this.domHelper.parseHTML(text, this.contextualElement);
    return this.setNode(fragment);
  };

  Morph.prototype.setMorphList = function Morph$appendMorphList(morphList) {
    morphList.mountedMorph = this;
    this.clear();

    var originalFirstNode = this.firstNode;

    if (morphList.firstChildMorph) {
      this.firstNode = morphList.firstChildMorph.firstNode;
      this.lastNode = morphList.lastChildMorph.lastNode;

      var current = morphList.firstChildMorph;

      while (current) {
        var next = current.nextMorph;
        current.insertBeforeNode(originalFirstNode, null);
        current = next;
      }
      originalFirstNode.parentNode.removeChild(originalFirstNode);
    }
  };

  Morph.prototype._syncFirstNode = function Morph$syncFirstNode() {
    var morph = this;
    var parentMorphList;
    while (parentMorphList = morph.parentMorphList) {
      if (parentMorphList.mountedMorph === null) {
        break;
      }
      if (morph !== parentMorphList.firstChildMorph) {
        break;
      }
      if (morph.firstNode === parentMorphList.mountedMorph.firstNode) {
        break;
      }

      parentMorphList.mountedMorph.firstNode = morph.firstNode;

      morph = parentMorphList.mountedMorph;
    }
  };

  Morph.prototype._syncLastNode = function Morph$syncLastNode() {
    var morph = this;
    var parentMorphList;
    while (parentMorphList = morph.parentMorphList) {
      if (parentMorphList.mountedMorph === null) {
        break;
      }
      if (morph !== parentMorphList.lastChildMorph) {
        break;
      }
      if (morph.lastNode === parentMorphList.mountedMorph.lastNode) {
        break;
      }

      parentMorphList.mountedMorph.lastNode = morph.lastNode;

      morph = parentMorphList.mountedMorph;
    }
  };

  Morph.prototype.insertBeforeNode = function Morph$insertBeforeNode(parent, reference) {
    var current = this.firstNode;

    while (current) {
      var next = current.nextSibling;
      parent.insertBefore(current, reference);
      current = next;
    }
  };

  Morph.prototype.appendToNode = function Morph$appendToNode(parent) {
    this.insertBeforeNode(parent, null);
  };

  exports['default'] = Morph;

});
enifed('morph-range/morph-list', ['exports', './utils'], function (exports, utils) {

  'use strict';

  function MorphList() {
    // morph graph
    this.firstChildMorph = null;
    this.lastChildMorph = null;

    this.mountedMorph = null;
  }

  var prototype = MorphList.prototype;

  prototype.clear = function MorphList$clear() {
    var current = this.firstChildMorph;

    while (current) {
      var next = current.nextMorph;
      current.previousMorph = null;
      current.nextMorph = null;
      current.parentMorphList = null;
      current = next;
    }

    this.firstChildMorph = this.lastChildMorph = null;
  };

  prototype.destroy = function MorphList$destroy() {};

  prototype.appendMorph = function MorphList$appendMorph(morph) {
    this.insertBeforeMorph(morph, null);
  };

  prototype.insertBeforeMorph = function MorphList$insertBeforeMorph(morph, referenceMorph) {
    if (morph.parentMorphList !== null) {
      morph.unlink();
    }
    if (referenceMorph && referenceMorph.parentMorphList !== this) {
      throw new Error('The morph before which the new morph is to be inserted is not a child of this morph.');
    }

    var mountedMorph = this.mountedMorph;

    if (mountedMorph) {

      var parentNode = mountedMorph.firstNode.parentNode;
      var referenceNode = referenceMorph ? referenceMorph.firstNode : mountedMorph.lastNode.nextSibling;

      utils.insertBefore(parentNode, morph.firstNode, morph.lastNode, referenceNode);

      // was not in list mode replace current content
      if (!this.firstChildMorph) {
        utils.clear(this.mountedMorph.firstNode.parentNode, this.mountedMorph.firstNode, this.mountedMorph.lastNode);
      }
    }

    morph.parentMorphList = this;

    var previousMorph = referenceMorph ? referenceMorph.previousMorph : this.lastChildMorph;
    if (previousMorph) {
      previousMorph.nextMorph = morph;
      morph.previousMorph = previousMorph;
    } else {
      this.firstChildMorph = morph;
    }

    if (referenceMorph) {
      referenceMorph.previousMorph = morph;
      morph.nextMorph = referenceMorph;
    } else {
      this.lastChildMorph = morph;
    }

    this.firstChildMorph._syncFirstNode();
    this.lastChildMorph._syncLastNode();
  };

  prototype.removeChildMorph = function MorphList$removeChildMorph(morph) {
    if (morph.parentMorphList !== this) {
      throw new Error('Cannot remove a morph from a parent it is not inside of');
    }

    morph.destroy();
  };

  exports['default'] = MorphList;

});
enifed('morph-range/morph-list.umd', ['./morph-list'], function (MorphList) {

  'use strict';

  (function (root, factory) {
    if (typeof enifed === 'function' && enifed.amd) {
      enifed([], factory);
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root.MorphList = factory();
    }
  })(undefined, function () {
    return MorphList['default'];
  });

});
enifed('morph-range/utils', ['exports'], function (exports) {

  'use strict';

  exports.clear = clear;
  exports.insertBefore = insertBefore;

  // inclusive of both nodes
  function clear(parentNode, firstNode, lastNode) {
    if (!parentNode) {
      return;
    }

    var node = firstNode;
    var nextNode;
    do {
      nextNode = node.nextSibling;
      parentNode.removeChild(node);
      if (node === lastNode) {
        break;
      }
      node = nextNode;
    } while (node);
  }

  function insertBefore(parentNode, firstNode, lastNode, _refNode) {
    var node = lastNode;
    var refNode = _refNode;
    var prevNode;
    do {
      prevNode = node.previousSibling;
      parentNode.insertBefore(node, refNode);
      if (node === firstNode) {
        break;
      }
      refNode = node;
      node = prevNode;
    } while (node);
  }

});
enifed('simple-html-tokenizer', ['exports', './simple-html-tokenizer/tokenizer', './simple-html-tokenizer/tokenize', './simple-html-tokenizer/generator', './simple-html-tokenizer/generate', './simple-html-tokenizer/tokens'], function (exports, Tokenizer, tokenize, Generator, generate, tokens) {

  'use strict';

  /*jshint boss:true*/

  exports.Tokenizer = Tokenizer['default'];
  exports.tokenize = tokenize['default'];
  exports.Generator = Generator['default'];
  exports.generate = generate['default'];
  exports.StartTag = tokens.StartTag;
  exports.EndTag = tokens.EndTag;
  exports.Chars = tokens.Chars;
  exports.Comment = tokens.Comment;

});
enifed('simple-html-tokenizer/char-refs/full', ['exports'], function (exports) {

  'use strict';

  exports['default'] = {
    AElig: [198],
    AMP: [38],
    Aacute: [193],
    Abreve: [258],
    Acirc: [194],
    Acy: [1040],
    Afr: [120068],
    Agrave: [192],
    Alpha: [913],
    Amacr: [256],
    And: [10835],
    Aogon: [260],
    Aopf: [120120],
    ApplyFunction: [8289],
    Aring: [197],
    Ascr: [119964],
    Assign: [8788],
    Atilde: [195],
    Auml: [196],
    Backslash: [8726],
    Barv: [10983],
    Barwed: [8966],
    Bcy: [1041],
    Because: [8757],
    Bernoullis: [8492],
    Beta: [914],
    Bfr: [120069],
    Bopf: [120121],
    Breve: [728],
    Bscr: [8492],
    Bumpeq: [8782],
    CHcy: [1063],
    COPY: [169],
    Cacute: [262],
    Cap: [8914],
    CapitalDifferentialD: [8517],
    Cayleys: [8493],
    Ccaron: [268],
    Ccedil: [199],
    Ccirc: [264],
    Cconint: [8752],
    Cdot: [266],
    Cedilla: [184],
    CenterDot: [183],
    Cfr: [8493],
    Chi: [935],
    CircleDot: [8857],
    CircleMinus: [8854],
    CirclePlus: [8853],
    CircleTimes: [8855],
    ClockwiseContourIntegral: [8754],
    CloseCurlyDoubleQuote: [8221],
    CloseCurlyQuote: [8217],
    Colon: [8759],
    Colone: [10868],
    Congruent: [8801],
    Conint: [8751],
    ContourIntegral: [8750],
    Copf: [8450],
    Coproduct: [8720],
    CounterClockwiseContourIntegral: [8755],
    Cross: [10799],
    Cscr: [119966],
    Cup: [8915],
    CupCap: [8781],
    DD: [8517],
    DDotrahd: [10513],
    DJcy: [1026],
    DScy: [1029],
    DZcy: [1039],
    Dagger: [8225],
    Darr: [8609],
    Dashv: [10980],
    Dcaron: [270],
    Dcy: [1044],
    Del: [8711],
    Delta: [916],
    Dfr: [120071],
    DiacriticalAcute: [180],
    DiacriticalDot: [729],
    DiacriticalDoubleAcute: [733],
    DiacriticalGrave: [96],
    DiacriticalTilde: [732],
    Diamond: [8900],
    DifferentialD: [8518],
    Dopf: [120123],
    Dot: [168],
    DotDot: [8412],
    DotEqual: [8784],
    DoubleContourIntegral: [8751],
    DoubleDot: [168],
    DoubleDownArrow: [8659],
    DoubleLeftArrow: [8656],
    DoubleLeftRightArrow: [8660],
    DoubleLeftTee: [10980],
    DoubleLongLeftArrow: [10232],
    DoubleLongLeftRightArrow: [10234],
    DoubleLongRightArrow: [10233],
    DoubleRightArrow: [8658],
    DoubleRightTee: [8872],
    DoubleUpArrow: [8657],
    DoubleUpDownArrow: [8661],
    DoubleVerticalBar: [8741],
    DownArrow: [8595],
    DownArrowBar: [10515],
    DownArrowUpArrow: [8693],
    DownBreve: [785],
    DownLeftRightVector: [10576],
    DownLeftTeeVector: [10590],
    DownLeftVector: [8637],
    DownLeftVectorBar: [10582],
    DownRightTeeVector: [10591],
    DownRightVector: [8641],
    DownRightVectorBar: [10583],
    DownTee: [8868],
    DownTeeArrow: [8615],
    Downarrow: [8659],
    Dscr: [119967],
    Dstrok: [272],
    ENG: [330],
    ETH: [208],
    Eacute: [201],
    Ecaron: [282],
    Ecirc: [202],
    Ecy: [1069],
    Edot: [278],
    Efr: [120072],
    Egrave: [200],
    Element: [8712],
    Emacr: [274],
    EmptySmallSquare: [9723],
    EmptyVerySmallSquare: [9643],
    Eogon: [280],
    Eopf: [120124],
    Epsilon: [917],
    Equal: [10869],
    EqualTilde: [8770],
    Equilibrium: [8652],
    Escr: [8496],
    Esim: [10867],
    Eta: [919],
    Euml: [203],
    Exists: [8707],
    ExponentialE: [8519],
    Fcy: [1060],
    Ffr: [120073],
    FilledSmallSquare: [9724],
    FilledVerySmallSquare: [9642],
    Fopf: [120125],
    ForAll: [8704],
    Fouriertrf: [8497],
    Fscr: [8497],
    GJcy: [1027],
    GT: [62],
    Gamma: [915],
    Gammad: [988],
    Gbreve: [286],
    Gcedil: [290],
    Gcirc: [284],
    Gcy: [1043],
    Gdot: [288],
    Gfr: [120074],
    Gg: [8921],
    Gopf: [120126],
    GreaterEqual: [8805],
    GreaterEqualLess: [8923],
    GreaterFullEqual: [8807],
    GreaterGreater: [10914],
    GreaterLess: [8823],
    GreaterSlantEqual: [10878],
    GreaterTilde: [8819],
    Gscr: [119970],
    Gt: [8811],
    HARDcy: [1066],
    Hacek: [711],
    Hat: [94],
    Hcirc: [292],
    Hfr: [8460],
    HilbertSpace: [8459],
    Hopf: [8461],
    HorizontalLine: [9472],
    Hscr: [8459],
    Hstrok: [294],
    HumpDownHump: [8782],
    HumpEqual: [8783],
    IEcy: [1045],
    IJlig: [306],
    IOcy: [1025],
    Iacute: [205],
    Icirc: [206],
    Icy: [1048],
    Idot: [304],
    Ifr: [8465],
    Igrave: [204],
    Im: [8465],
    Imacr: [298],
    ImaginaryI: [8520],
    Implies: [8658],
    Int: [8748],
    Integral: [8747],
    Intersection: [8898],
    InvisibleComma: [8291],
    InvisibleTimes: [8290],
    Iogon: [302],
    Iopf: [120128],
    Iota: [921],
    Iscr: [8464],
    Itilde: [296],
    Iukcy: [1030],
    Iuml: [207],
    Jcirc: [308],
    Jcy: [1049],
    Jfr: [120077],
    Jopf: [120129],
    Jscr: [119973],
    Jsercy: [1032],
    Jukcy: [1028],
    KHcy: [1061],
    KJcy: [1036],
    Kappa: [922],
    Kcedil: [310],
    Kcy: [1050],
    Kfr: [120078],
    Kopf: [120130],
    Kscr: [119974],
    LJcy: [1033],
    LT: [60],
    Lacute: [313],
    Lambda: [923],
    Lang: [10218],
    Laplacetrf: [8466],
    Larr: [8606],
    Lcaron: [317],
    Lcedil: [315],
    Lcy: [1051],
    LeftAngleBracket: [10216],
    LeftArrow: [8592],
    LeftArrowBar: [8676],
    LeftArrowRightArrow: [8646],
    LeftCeiling: [8968],
    LeftDoubleBracket: [10214],
    LeftDownTeeVector: [10593],
    LeftDownVector: [8643],
    LeftDownVectorBar: [10585],
    LeftFloor: [8970],
    LeftRightArrow: [8596],
    LeftRightVector: [10574],
    LeftTee: [8867],
    LeftTeeArrow: [8612],
    LeftTeeVector: [10586],
    LeftTriangle: [8882],
    LeftTriangleBar: [10703],
    LeftTriangleEqual: [8884],
    LeftUpDownVector: [10577],
    LeftUpTeeVector: [10592],
    LeftUpVector: [8639],
    LeftUpVectorBar: [10584],
    LeftVector: [8636],
    LeftVectorBar: [10578],
    Leftarrow: [8656],
    Leftrightarrow: [8660],
    LessEqualGreater: [8922],
    LessFullEqual: [8806],
    LessGreater: [8822],
    LessLess: [10913],
    LessSlantEqual: [10877],
    LessTilde: [8818],
    Lfr: [120079],
    Ll: [8920],
    Lleftarrow: [8666],
    Lmidot: [319],
    LongLeftArrow: [10229],
    LongLeftRightArrow: [10231],
    LongRightArrow: [10230],
    Longleftarrow: [10232],
    Longleftrightarrow: [10234],
    Longrightarrow: [10233],
    Lopf: [120131],
    LowerLeftArrow: [8601],
    LowerRightArrow: [8600],
    Lscr: [8466],
    Lsh: [8624],
    Lstrok: [321],
    Lt: [8810],
    Map: [10501],
    Mcy: [1052],
    MediumSpace: [8287],
    Mellintrf: [8499],
    Mfr: [120080],
    MinusPlus: [8723],
    Mopf: [120132],
    Mscr: [8499],
    Mu: [924],
    NJcy: [1034],
    Nacute: [323],
    Ncaron: [327],
    Ncedil: [325],
    Ncy: [1053],
    NegativeMediumSpace: [8203],
    NegativeThickSpace: [8203],
    NegativeThinSpace: [8203],
    NegativeVeryThinSpace: [8203],
    NestedGreaterGreater: [8811],
    NestedLessLess: [8810],
    NewLine: [10],
    Nfr: [120081],
    NoBreak: [8288],
    NonBreakingSpace: [160],
    Nopf: [8469],
    Not: [10988],
    NotCongruent: [8802],
    NotCupCap: [8813],
    NotDoubleVerticalBar: [8742],
    NotElement: [8713],
    NotEqual: [8800],
    NotEqualTilde: [8770, 824],
    NotExists: [8708],
    NotGreater: [8815],
    NotGreaterEqual: [8817],
    NotGreaterFullEqual: [8807, 824],
    NotGreaterGreater: [8811, 824],
    NotGreaterLess: [8825],
    NotGreaterSlantEqual: [10878, 824],
    NotGreaterTilde: [8821],
    NotHumpDownHump: [8782, 824],
    NotHumpEqual: [8783, 824],
    NotLeftTriangle: [8938],
    NotLeftTriangleBar: [10703, 824],
    NotLeftTriangleEqual: [8940],
    NotLess: [8814],
    NotLessEqual: [8816],
    NotLessGreater: [8824],
    NotLessLess: [8810, 824],
    NotLessSlantEqual: [10877, 824],
    NotLessTilde: [8820],
    NotNestedGreaterGreater: [10914, 824],
    NotNestedLessLess: [10913, 824],
    NotPrecedes: [8832],
    NotPrecedesEqual: [10927, 824],
    NotPrecedesSlantEqual: [8928],
    NotReverseElement: [8716],
    NotRightTriangle: [8939],
    NotRightTriangleBar: [10704, 824],
    NotRightTriangleEqual: [8941],
    NotSquareSubset: [8847, 824],
    NotSquareSubsetEqual: [8930],
    NotSquareSuperset: [8848, 824],
    NotSquareSupersetEqual: [8931],
    NotSubset: [8834, 8402],
    NotSubsetEqual: [8840],
    NotSucceeds: [8833],
    NotSucceedsEqual: [10928, 824],
    NotSucceedsSlantEqual: [8929],
    NotSucceedsTilde: [8831, 824],
    NotSuperset: [8835, 8402],
    NotSupersetEqual: [8841],
    NotTilde: [8769],
    NotTildeEqual: [8772],
    NotTildeFullEqual: [8775],
    NotTildeTilde: [8777],
    NotVerticalBar: [8740],
    Nscr: [119977],
    Ntilde: [209],
    Nu: [925],
    OElig: [338],
    Oacute: [211],
    Ocirc: [212],
    Ocy: [1054],
    Odblac: [336],
    Ofr: [120082],
    Ograve: [210],
    Omacr: [332],
    Omega: [937],
    Omicron: [927],
    Oopf: [120134],
    OpenCurlyDoubleQuote: [8220],
    OpenCurlyQuote: [8216],
    Or: [10836],
    Oscr: [119978],
    Oslash: [216],
    Otilde: [213],
    Otimes: [10807],
    Ouml: [214],
    OverBar: [8254],
    OverBrace: [9182],
    OverBracket: [9140],
    OverParenthesis: [9180],
    PartialD: [8706],
    Pcy: [1055],
    Pfr: [120083],
    Phi: [934],
    Pi: [928],
    PlusMinus: [177],
    Poincareplane: [8460],
    Popf: [8473],
    Pr: [10939],
    Precedes: [8826],
    PrecedesEqual: [10927],
    PrecedesSlantEqual: [8828],
    PrecedesTilde: [8830],
    Prime: [8243],
    Product: [8719],
    Proportion: [8759],
    Proportional: [8733],
    Pscr: [119979],
    Psi: [936],
    QUOT: [34],
    Qfr: [120084],
    Qopf: [8474],
    Qscr: [119980],
    RBarr: [10512],
    REG: [174],
    Racute: [340],
    Rang: [10219],
    Rarr: [8608],
    Rarrtl: [10518],
    Rcaron: [344],
    Rcedil: [342],
    Rcy: [1056],
    Re: [8476],
    ReverseElement: [8715],
    ReverseEquilibrium: [8651],
    ReverseUpEquilibrium: [10607],
    Rfr: [8476],
    Rho: [929],
    RightAngleBracket: [10217],
    RightArrow: [8594],
    RightArrowBar: [8677],
    RightArrowLeftArrow: [8644],
    RightCeiling: [8969],
    RightDoubleBracket: [10215],
    RightDownTeeVector: [10589],
    RightDownVector: [8642],
    RightDownVectorBar: [10581],
    RightFloor: [8971],
    RightTee: [8866],
    RightTeeArrow: [8614],
    RightTeeVector: [10587],
    RightTriangle: [8883],
    RightTriangleBar: [10704],
    RightTriangleEqual: [8885],
    RightUpDownVector: [10575],
    RightUpTeeVector: [10588],
    RightUpVector: [8638],
    RightUpVectorBar: [10580],
    RightVector: [8640],
    RightVectorBar: [10579],
    Rightarrow: [8658],
    Ropf: [8477],
    RoundImplies: [10608],
    Rrightarrow: [8667],
    Rscr: [8475],
    Rsh: [8625],
    RuleDelayed: [10740],
    SHCHcy: [1065],
    SHcy: [1064],
    SOFTcy: [1068],
    Sacute: [346],
    Sc: [10940],
    Scaron: [352],
    Scedil: [350],
    Scirc: [348],
    Scy: [1057],
    Sfr: [120086],
    ShortDownArrow: [8595],
    ShortLeftArrow: [8592],
    ShortRightArrow: [8594],
    ShortUpArrow: [8593],
    Sigma: [931],
    SmallCircle: [8728],
    Sopf: [120138],
    Sqrt: [8730],
    Square: [9633],
    SquareIntersection: [8851],
    SquareSubset: [8847],
    SquareSubsetEqual: [8849],
    SquareSuperset: [8848],
    SquareSupersetEqual: [8850],
    SquareUnion: [8852],
    Sscr: [119982],
    Star: [8902],
    Sub: [8912],
    Subset: [8912],
    SubsetEqual: [8838],
    Succeeds: [8827],
    SucceedsEqual: [10928],
    SucceedsSlantEqual: [8829],
    SucceedsTilde: [8831],
    SuchThat: [8715],
    Sum: [8721],
    Sup: [8913],
    Superset: [8835],
    SupersetEqual: [8839],
    Supset: [8913],
    THORN: [222],
    TRADE: [8482],
    TSHcy: [1035],
    TScy: [1062],
    Tab: [9],
    Tau: [932],
    Tcaron: [356],
    Tcedil: [354],
    Tcy: [1058],
    Tfr: [120087],
    Therefore: [8756],
    Theta: [920],
    ThickSpace: [8287, 8202],
    ThinSpace: [8201],
    Tilde: [8764],
    TildeEqual: [8771],
    TildeFullEqual: [8773],
    TildeTilde: [8776],
    Topf: [120139],
    TripleDot: [8411],
    Tscr: [119983],
    Tstrok: [358],
    Uacute: [218],
    Uarr: [8607],
    Uarrocir: [10569],
    Ubrcy: [1038],
    Ubreve: [364],
    Ucirc: [219],
    Ucy: [1059],
    Udblac: [368],
    Ufr: [120088],
    Ugrave: [217],
    Umacr: [362],
    UnderBar: [95],
    UnderBrace: [9183],
    UnderBracket: [9141],
    UnderParenthesis: [9181],
    Union: [8899],
    UnionPlus: [8846],
    Uogon: [370],
    Uopf: [120140],
    UpArrow: [8593],
    UpArrowBar: [10514],
    UpArrowDownArrow: [8645],
    UpDownArrow: [8597],
    UpEquilibrium: [10606],
    UpTee: [8869],
    UpTeeArrow: [8613],
    Uparrow: [8657],
    Updownarrow: [8661],
    UpperLeftArrow: [8598],
    UpperRightArrow: [8599],
    Upsi: [978],
    Upsilon: [933],
    Uring: [366],
    Uscr: [119984],
    Utilde: [360],
    Uuml: [220],
    VDash: [8875],
    Vbar: [10987],
    Vcy: [1042],
    Vdash: [8873],
    Vdashl: [10982],
    Vee: [8897],
    Verbar: [8214],
    Vert: [8214],
    VerticalBar: [8739],
    VerticalLine: [124],
    VerticalSeparator: [10072],
    VerticalTilde: [8768],
    VeryThinSpace: [8202],
    Vfr: [120089],
    Vopf: [120141],
    Vscr: [119985],
    Vvdash: [8874],
    Wcirc: [372],
    Wedge: [8896],
    Wfr: [120090],
    Wopf: [120142],
    Wscr: [119986],
    Xfr: [120091],
    Xi: [926],
    Xopf: [120143],
    Xscr: [119987],
    YAcy: [1071],
    YIcy: [1031],
    YUcy: [1070],
    Yacute: [221],
    Ycirc: [374],
    Ycy: [1067],
    Yfr: [120092],
    Yopf: [120144],
    Yscr: [119988],
    Yuml: [376],
    ZHcy: [1046],
    Zacute: [377],
    Zcaron: [381],
    Zcy: [1047],
    Zdot: [379],
    ZeroWidthSpace: [8203],
    Zeta: [918],
    Zfr: [8488],
    Zopf: [8484],
    Zscr: [119989],
    aacute: [225],
    abreve: [259],
    ac: [8766],
    acE: [8766, 819],
    acd: [8767],
    acirc: [226],
    acute: [180],
    acy: [1072],
    aelig: [230],
    af: [8289],
    afr: [120094],
    agrave: [224],
    alefsym: [8501],
    aleph: [8501],
    alpha: [945],
    amacr: [257],
    amalg: [10815],
    amp: [38],
    and: [8743],
    andand: [10837],
    andd: [10844],
    andslope: [10840],
    andv: [10842],
    ang: [8736],
    ange: [10660],
    angle: [8736],
    angmsd: [8737],
    angmsdaa: [10664],
    angmsdab: [10665],
    angmsdac: [10666],
    angmsdad: [10667],
    angmsdae: [10668],
    angmsdaf: [10669],
    angmsdag: [10670],
    angmsdah: [10671],
    angrt: [8735],
    angrtvb: [8894],
    angrtvbd: [10653],
    angsph: [8738],
    angst: [197],
    angzarr: [9084],
    aogon: [261],
    aopf: [120146],
    ap: [8776],
    apE: [10864],
    apacir: [10863],
    ape: [8778],
    apid: [8779],
    apos: [39],
    approx: [8776],
    approxeq: [8778],
    aring: [229],
    ascr: [119990],
    ast: [42],
    asymp: [8776],
    asympeq: [8781],
    atilde: [227],
    auml: [228],
    awconint: [8755],
    awint: [10769],
    bNot: [10989],
    backcong: [8780],
    backepsilon: [1014],
    backprime: [8245],
    backsim: [8765],
    backsimeq: [8909],
    barvee: [8893],
    barwed: [8965],
    barwedge: [8965],
    bbrk: [9141],
    bbrktbrk: [9142],
    bcong: [8780],
    bcy: [1073],
    bdquo: [8222],
    becaus: [8757],
    because: [8757],
    bemptyv: [10672],
    bepsi: [1014],
    bernou: [8492],
    beta: [946],
    beth: [8502],
    between: [8812],
    bfr: [120095],
    bigcap: [8898],
    bigcirc: [9711],
    bigcup: [8899],
    bigodot: [10752],
    bigoplus: [10753],
    bigotimes: [10754],
    bigsqcup: [10758],
    bigstar: [9733],
    bigtriangledown: [9661],
    bigtriangleup: [9651],
    biguplus: [10756],
    bigvee: [8897],
    bigwedge: [8896],
    bkarow: [10509],
    blacklozenge: [10731],
    blacksquare: [9642],
    blacktriangle: [9652],
    blacktriangledown: [9662],
    blacktriangleleft: [9666],
    blacktriangleright: [9656],
    blank: [9251],
    blk12: [9618],
    blk14: [9617],
    blk34: [9619],
    block: [9608],
    bne: [61, 8421],
    bnequiv: [8801, 8421],
    bnot: [8976],
    bopf: [120147],
    bot: [8869],
    bottom: [8869],
    bowtie: [8904],
    boxDL: [9559],
    boxDR: [9556],
    boxDl: [9558],
    boxDr: [9555],
    boxH: [9552],
    boxHD: [9574],
    boxHU: [9577],
    boxHd: [9572],
    boxHu: [9575],
    boxUL: [9565],
    boxUR: [9562],
    boxUl: [9564],
    boxUr: [9561],
    boxV: [9553],
    boxVH: [9580],
    boxVL: [9571],
    boxVR: [9568],
    boxVh: [9579],
    boxVl: [9570],
    boxVr: [9567],
    boxbox: [10697],
    boxdL: [9557],
    boxdR: [9554],
    boxdl: [9488],
    boxdr: [9484],
    boxh: [9472],
    boxhD: [9573],
    boxhU: [9576],
    boxhd: [9516],
    boxhu: [9524],
    boxminus: [8863],
    boxplus: [8862],
    boxtimes: [8864],
    boxuL: [9563],
    boxuR: [9560],
    boxul: [9496],
    boxur: [9492],
    boxv: [9474],
    boxvH: [9578],
    boxvL: [9569],
    boxvR: [9566],
    boxvh: [9532],
    boxvl: [9508],
    boxvr: [9500],
    bprime: [8245],
    breve: [728],
    brvbar: [166],
    bscr: [119991],
    bsemi: [8271],
    bsim: [8765],
    bsime: [8909],
    bsol: [92],
    bsolb: [10693],
    bsolhsub: [10184],
    bull: [8226],
    bullet: [8226],
    bump: [8782],
    bumpE: [10926],
    bumpe: [8783],
    bumpeq: [8783],
    cacute: [263],
    cap: [8745],
    capand: [10820],
    capbrcup: [10825],
    capcap: [10827],
    capcup: [10823],
    capdot: [10816],
    caps: [8745, 65024],
    caret: [8257],
    caron: [711],
    ccaps: [10829],
    ccaron: [269],
    ccedil: [231],
    ccirc: [265],
    ccups: [10828],
    ccupssm: [10832],
    cdot: [267],
    cedil: [184],
    cemptyv: [10674],
    cent: [162],
    centerdot: [183],
    cfr: [120096],
    chcy: [1095],
    check: [10003],
    checkmark: [10003],
    chi: [967],
    cir: [9675],
    cirE: [10691],
    circ: [710],
    circeq: [8791],
    circlearrowleft: [8634],
    circlearrowright: [8635],
    circledR: [174],
    circledS: [9416],
    circledast: [8859],
    circledcirc: [8858],
    circleddash: [8861],
    cire: [8791],
    cirfnint: [10768],
    cirmid: [10991],
    cirscir: [10690],
    clubs: [9827],
    clubsuit: [9827],
    colon: [58],
    colone: [8788],
    coloneq: [8788],
    comma: [44],
    commat: [64],
    comp: [8705],
    compfn: [8728],
    complement: [8705],
    complexes: [8450],
    cong: [8773],
    congdot: [10861],
    conint: [8750],
    copf: [120148],
    coprod: [8720],
    copy: [169],
    copysr: [8471],
    crarr: [8629],
    cross: [10007],
    cscr: [119992],
    csub: [10959],
    csube: [10961],
    csup: [10960],
    csupe: [10962],
    ctdot: [8943],
    cudarrl: [10552],
    cudarrr: [10549],
    cuepr: [8926],
    cuesc: [8927],
    cularr: [8630],
    cularrp: [10557],
    cup: [8746],
    cupbrcap: [10824],
    cupcap: [10822],
    cupcup: [10826],
    cupdot: [8845],
    cupor: [10821],
    cups: [8746, 65024],
    curarr: [8631],
    curarrm: [10556],
    curlyeqprec: [8926],
    curlyeqsucc: [8927],
    curlyvee: [8910],
    curlywedge: [8911],
    curren: [164],
    curvearrowleft: [8630],
    curvearrowright: [8631],
    cuvee: [8910],
    cuwed: [8911],
    cwconint: [8754],
    cwint: [8753],
    cylcty: [9005],
    dArr: [8659],
    dHar: [10597],
    dagger: [8224],
    daleth: [8504],
    darr: [8595],
    dash: [8208],
    dashv: [8867],
    dbkarow: [10511],
    dblac: [733],
    dcaron: [271],
    dcy: [1076],
    dd: [8518],
    ddagger: [8225],
    ddarr: [8650],
    ddotseq: [10871],
    deg: [176],
    delta: [948],
    demptyv: [10673],
    dfisht: [10623],
    dfr: [120097],
    dharl: [8643],
    dharr: [8642],
    diam: [8900],
    diamond: [8900],
    diamondsuit: [9830],
    diams: [9830],
    die: [168],
    digamma: [989],
    disin: [8946],
    div: [247],
    divide: [247],
    divideontimes: [8903],
    divonx: [8903],
    djcy: [1106],
    dlcorn: [8990],
    dlcrop: [8973],
    dollar: [36],
    dopf: [120149],
    dot: [729],
    doteq: [8784],
    doteqdot: [8785],
    dotminus: [8760],
    dotplus: [8724],
    dotsquare: [8865],
    doublebarwedge: [8966],
    downarrow: [8595],
    downdownarrows: [8650],
    downharpoonleft: [8643],
    downharpoonright: [8642],
    drbkarow: [10512],
    drcorn: [8991],
    drcrop: [8972],
    dscr: [119993],
    dscy: [1109],
    dsol: [10742],
    dstrok: [273],
    dtdot: [8945],
    dtri: [9663],
    dtrif: [9662],
    duarr: [8693],
    duhar: [10607],
    dwangle: [10662],
    dzcy: [1119],
    dzigrarr: [10239],
    eDDot: [10871],
    eDot: [8785],
    eacute: [233],
    easter: [10862],
    ecaron: [283],
    ecir: [8790],
    ecirc: [234],
    ecolon: [8789],
    ecy: [1101],
    edot: [279],
    ee: [8519],
    efDot: [8786],
    efr: [120098],
    eg: [10906],
    egrave: [232],
    egs: [10902],
    egsdot: [10904],
    el: [10905],
    elinters: [9191],
    ell: [8467],
    els: [10901],
    elsdot: [10903],
    emacr: [275],
    empty: [8709],
    emptyset: [8709],
    emptyv: [8709],
    emsp: [8195],
    emsp13: [8196],
    emsp14: [8197],
    eng: [331],
    ensp: [8194],
    eogon: [281],
    eopf: [120150],
    epar: [8917],
    eparsl: [10723],
    eplus: [10865],
    epsi: [949],
    epsilon: [949],
    epsiv: [1013],
    eqcirc: [8790],
    eqcolon: [8789],
    eqsim: [8770],
    eqslantgtr: [10902],
    eqslantless: [10901],
    equals: [61],
    equest: [8799],
    equiv: [8801],
    equivDD: [10872],
    eqvparsl: [10725],
    erDot: [8787],
    erarr: [10609],
    escr: [8495],
    esdot: [8784],
    esim: [8770],
    eta: [951],
    eth: [240],
    euml: [235],
    euro: [8364],
    excl: [33],
    exist: [8707],
    expectation: [8496],
    exponentiale: [8519],
    fallingdotseq: [8786],
    fcy: [1092],
    female: [9792],
    ffilig: [64259],
    fflig: [64256],
    ffllig: [64260],
    ffr: [120099],
    filig: [64257],
    fjlig: [102, 106],
    flat: [9837],
    fllig: [64258],
    fltns: [9649],
    fnof: [402],
    fopf: [120151],
    forall: [8704],
    fork: [8916],
    forkv: [10969],
    fpartint: [10765],
    frac12: [189],
    frac13: [8531],
    frac14: [188],
    frac15: [8533],
    frac16: [8537],
    frac18: [8539],
    frac23: [8532],
    frac25: [8534],
    frac34: [190],
    frac35: [8535],
    frac38: [8540],
    frac45: [8536],
    frac56: [8538],
    frac58: [8541],
    frac78: [8542],
    frasl: [8260],
    frown: [8994],
    fscr: [119995],
    gE: [8807],
    gEl: [10892],
    gacute: [501],
    gamma: [947],
    gammad: [989],
    gap: [10886],
    gbreve: [287],
    gcirc: [285],
    gcy: [1075],
    gdot: [289],
    ge: [8805],
    gel: [8923],
    geq: [8805],
    geqq: [8807],
    geqslant: [10878],
    ges: [10878],
    gescc: [10921],
    gesdot: [10880],
    gesdoto: [10882],
    gesdotol: [10884],
    gesl: [8923, 65024],
    gesles: [10900],
    gfr: [120100],
    gg: [8811],
    ggg: [8921],
    gimel: [8503],
    gjcy: [1107],
    gl: [8823],
    glE: [10898],
    gla: [10917],
    glj: [10916],
    gnE: [8809],
    gnap: [10890],
    gnapprox: [10890],
    gne: [10888],
    gneq: [10888],
    gneqq: [8809],
    gnsim: [8935],
    gopf: [120152],
    grave: [96],
    gscr: [8458],
    gsim: [8819],
    gsime: [10894],
    gsiml: [10896],
    gt: [62],
    gtcc: [10919],
    gtcir: [10874],
    gtdot: [8919],
    gtlPar: [10645],
    gtquest: [10876],
    gtrapprox: [10886],
    gtrarr: [10616],
    gtrdot: [8919],
    gtreqless: [8923],
    gtreqqless: [10892],
    gtrless: [8823],
    gtrsim: [8819],
    gvertneqq: [8809, 65024],
    gvnE: [8809, 65024],
    hArr: [8660],
    hairsp: [8202],
    half: [189],
    hamilt: [8459],
    hardcy: [1098],
    harr: [8596],
    harrcir: [10568],
    harrw: [8621],
    hbar: [8463],
    hcirc: [293],
    hearts: [9829],
    heartsuit: [9829],
    hellip: [8230],
    hercon: [8889],
    hfr: [120101],
    hksearow: [10533],
    hkswarow: [10534],
    hoarr: [8703],
    homtht: [8763],
    hookleftarrow: [8617],
    hookrightarrow: [8618],
    hopf: [120153],
    horbar: [8213],
    hscr: [119997],
    hslash: [8463],
    hstrok: [295],
    hybull: [8259],
    hyphen: [8208],
    iacute: [237],
    ic: [8291],
    icirc: [238],
    icy: [1080],
    iecy: [1077],
    iexcl: [161],
    iff: [8660],
    ifr: [120102],
    igrave: [236],
    ii: [8520],
    iiiint: [10764],
    iiint: [8749],
    iinfin: [10716],
    iiota: [8489],
    ijlig: [307],
    imacr: [299],
    image: [8465],
    imagline: [8464],
    imagpart: [8465],
    imath: [305],
    imof: [8887],
    imped: [437],
    "in": [8712],
    incare: [8453],
    infin: [8734],
    infintie: [10717],
    inodot: [305],
    "int": [8747],
    intcal: [8890],
    integers: [8484],
    intercal: [8890],
    intlarhk: [10775],
    intprod: [10812],
    iocy: [1105],
    iogon: [303],
    iopf: [120154],
    iota: [953],
    iprod: [10812],
    iquest: [191],
    iscr: [119998],
    isin: [8712],
    isinE: [8953],
    isindot: [8949],
    isins: [8948],
    isinsv: [8947],
    isinv: [8712],
    it: [8290],
    itilde: [297],
    iukcy: [1110],
    iuml: [239],
    jcirc: [309],
    jcy: [1081],
    jfr: [120103],
    jmath: [567],
    jopf: [120155],
    jscr: [119999],
    jsercy: [1112],
    jukcy: [1108],
    kappa: [954],
    kappav: [1008],
    kcedil: [311],
    kcy: [1082],
    kfr: [120104],
    kgreen: [312],
    khcy: [1093],
    kjcy: [1116],
    kopf: [120156],
    kscr: [120000],
    lAarr: [8666],
    lArr: [8656],
    lAtail: [10523],
    lBarr: [10510],
    lE: [8806],
    lEg: [10891],
    lHar: [10594],
    lacute: [314],
    laemptyv: [10676],
    lagran: [8466],
    lambda: [955],
    lang: [10216],
    langd: [10641],
    langle: [10216],
    lap: [10885],
    laquo: [171],
    larr: [8592],
    larrb: [8676],
    larrbfs: [10527],
    larrfs: [10525],
    larrhk: [8617],
    larrlp: [8619],
    larrpl: [10553],
    larrsim: [10611],
    larrtl: [8610],
    lat: [10923],
    latail: [10521],
    late: [10925],
    lates: [10925, 65024],
    lbarr: [10508],
    lbbrk: [10098],
    lbrace: [123],
    lbrack: [91],
    lbrke: [10635],
    lbrksld: [10639],
    lbrkslu: [10637],
    lcaron: [318],
    lcedil: [316],
    lceil: [8968],
    lcub: [123],
    lcy: [1083],
    ldca: [10550],
    ldquo: [8220],
    ldquor: [8222],
    ldrdhar: [10599],
    ldrushar: [10571],
    ldsh: [8626],
    le: [8804],
    leftarrow: [8592],
    leftarrowtail: [8610],
    leftharpoondown: [8637],
    leftharpoonup: [8636],
    leftleftarrows: [8647],
    leftrightarrow: [8596],
    leftrightarrows: [8646],
    leftrightharpoons: [8651],
    leftrightsquigarrow: [8621],
    leftthreetimes: [8907],
    leg: [8922],
    leq: [8804],
    leqq: [8806],
    leqslant: [10877],
    les: [10877],
    lescc: [10920],
    lesdot: [10879],
    lesdoto: [10881],
    lesdotor: [10883],
    lesg: [8922, 65024],
    lesges: [10899],
    lessapprox: [10885],
    lessdot: [8918],
    lesseqgtr: [8922],
    lesseqqgtr: [10891],
    lessgtr: [8822],
    lesssim: [8818],
    lfisht: [10620],
    lfloor: [8970],
    lfr: [120105],
    lg: [8822],
    lgE: [10897],
    lhard: [8637],
    lharu: [8636],
    lharul: [10602],
    lhblk: [9604],
    ljcy: [1113],
    ll: [8810],
    llarr: [8647],
    llcorner: [8990],
    llhard: [10603],
    lltri: [9722],
    lmidot: [320],
    lmoust: [9136],
    lmoustache: [9136],
    lnE: [8808],
    lnap: [10889],
    lnapprox: [10889],
    lne: [10887],
    lneq: [10887],
    lneqq: [8808],
    lnsim: [8934],
    loang: [10220],
    loarr: [8701],
    lobrk: [10214],
    longleftarrow: [10229],
    longleftrightarrow: [10231],
    longmapsto: [10236],
    longrightarrow: [10230],
    looparrowleft: [8619],
    looparrowright: [8620],
    lopar: [10629],
    lopf: [120157],
    loplus: [10797],
    lotimes: [10804],
    lowast: [8727],
    lowbar: [95],
    loz: [9674],
    lozenge: [9674],
    lozf: [10731],
    lpar: [40],
    lparlt: [10643],
    lrarr: [8646],
    lrcorner: [8991],
    lrhar: [8651],
    lrhard: [10605],
    lrm: [8206],
    lrtri: [8895],
    lsaquo: [8249],
    lscr: [120001],
    lsh: [8624],
    lsim: [8818],
    lsime: [10893],
    lsimg: [10895],
    lsqb: [91],
    lsquo: [8216],
    lsquor: [8218],
    lstrok: [322],
    lt: [60],
    ltcc: [10918],
    ltcir: [10873],
    ltdot: [8918],
    lthree: [8907],
    ltimes: [8905],
    ltlarr: [10614],
    ltquest: [10875],
    ltrPar: [10646],
    ltri: [9667],
    ltrie: [8884],
    ltrif: [9666],
    lurdshar: [10570],
    luruhar: [10598],
    lvertneqq: [8808, 65024],
    lvnE: [8808, 65024],
    mDDot: [8762],
    macr: [175],
    male: [9794],
    malt: [10016],
    maltese: [10016],
    map: [8614],
    mapsto: [8614],
    mapstodown: [8615],
    mapstoleft: [8612],
    mapstoup: [8613],
    marker: [9646],
    mcomma: [10793],
    mcy: [1084],
    mdash: [8212],
    measuredangle: [8737],
    mfr: [120106],
    mho: [8487],
    micro: [181],
    mid: [8739],
    midast: [42],
    midcir: [10992],
    middot: [183],
    minus: [8722],
    minusb: [8863],
    minusd: [8760],
    minusdu: [10794],
    mlcp: [10971],
    mldr: [8230],
    mnplus: [8723],
    models: [8871],
    mopf: [120158],
    mp: [8723],
    mscr: [120002],
    mstpos: [8766],
    mu: [956],
    multimap: [8888],
    mumap: [8888],
    nGg: [8921, 824],
    nGt: [8811, 8402],
    nGtv: [8811, 824],
    nLeftarrow: [8653],
    nLeftrightarrow: [8654],
    nLl: [8920, 824],
    nLt: [8810, 8402],
    nLtv: [8810, 824],
    nRightarrow: [8655],
    nVDash: [8879],
    nVdash: [8878],
    nabla: [8711],
    nacute: [324],
    nang: [8736, 8402],
    nap: [8777],
    napE: [10864, 824],
    napid: [8779, 824],
    napos: [329],
    napprox: [8777],
    natur: [9838],
    natural: [9838],
    naturals: [8469],
    nbsp: [160],
    nbump: [8782, 824],
    nbumpe: [8783, 824],
    ncap: [10819],
    ncaron: [328],
    ncedil: [326],
    ncong: [8775],
    ncongdot: [10861, 824],
    ncup: [10818],
    ncy: [1085],
    ndash: [8211],
    ne: [8800],
    neArr: [8663],
    nearhk: [10532],
    nearr: [8599],
    nearrow: [8599],
    nedot: [8784, 824],
    nequiv: [8802],
    nesear: [10536],
    nesim: [8770, 824],
    nexist: [8708],
    nexists: [8708],
    nfr: [120107],
    ngE: [8807, 824],
    nge: [8817],
    ngeq: [8817],
    ngeqq: [8807, 824],
    ngeqslant: [10878, 824],
    nges: [10878, 824],
    ngsim: [8821],
    ngt: [8815],
    ngtr: [8815],
    nhArr: [8654],
    nharr: [8622],
    nhpar: [10994],
    ni: [8715],
    nis: [8956],
    nisd: [8954],
    niv: [8715],
    njcy: [1114],
    nlArr: [8653],
    nlE: [8806, 824],
    nlarr: [8602],
    nldr: [8229],
    nle: [8816],
    nleftarrow: [8602],
    nleftrightarrow: [8622],
    nleq: [8816],
    nleqq: [8806, 824],
    nleqslant: [10877, 824],
    nles: [10877, 824],
    nless: [8814],
    nlsim: [8820],
    nlt: [8814],
    nltri: [8938],
    nltrie: [8940],
    nmid: [8740],
    nopf: [120159],
    not: [172],
    notin: [8713],
    notinE: [8953, 824],
    notindot: [8949, 824],
    notinva: [8713],
    notinvb: [8951],
    notinvc: [8950],
    notni: [8716],
    notniva: [8716],
    notnivb: [8958],
    notnivc: [8957],
    npar: [8742],
    nparallel: [8742],
    nparsl: [11005, 8421],
    npart: [8706, 824],
    npolint: [10772],
    npr: [8832],
    nprcue: [8928],
    npre: [10927, 824],
    nprec: [8832],
    npreceq: [10927, 824],
    nrArr: [8655],
    nrarr: [8603],
    nrarrc: [10547, 824],
    nrarrw: [8605, 824],
    nrightarrow: [8603],
    nrtri: [8939],
    nrtrie: [8941],
    nsc: [8833],
    nsccue: [8929],
    nsce: [10928, 824],
    nscr: [120003],
    nshortmid: [8740],
    nshortparallel: [8742],
    nsim: [8769],
    nsime: [8772],
    nsimeq: [8772],
    nsmid: [8740],
    nspar: [8742],
    nsqsube: [8930],
    nsqsupe: [8931],
    nsub: [8836],
    nsubE: [10949, 824],
    nsube: [8840],
    nsubset: [8834, 8402],
    nsubseteq: [8840],
    nsubseteqq: [10949, 824],
    nsucc: [8833],
    nsucceq: [10928, 824],
    nsup: [8837],
    nsupE: [10950, 824],
    nsupe: [8841],
    nsupset: [8835, 8402],
    nsupseteq: [8841],
    nsupseteqq: [10950, 824],
    ntgl: [8825],
    ntilde: [241],
    ntlg: [8824],
    ntriangleleft: [8938],
    ntrianglelefteq: [8940],
    ntriangleright: [8939],
    ntrianglerighteq: [8941],
    nu: [957],
    num: [35],
    numero: [8470],
    numsp: [8199],
    nvDash: [8877],
    nvHarr: [10500],
    nvap: [8781, 8402],
    nvdash: [8876],
    nvge: [8805, 8402],
    nvgt: [62, 8402],
    nvinfin: [10718],
    nvlArr: [10498],
    nvle: [8804, 8402],
    nvlt: [60, 8402],
    nvltrie: [8884, 8402],
    nvrArr: [10499],
    nvrtrie: [8885, 8402],
    nvsim: [8764, 8402],
    nwArr: [8662],
    nwarhk: [10531],
    nwarr: [8598],
    nwarrow: [8598],
    nwnear: [10535],
    oS: [9416],
    oacute: [243],
    oast: [8859],
    ocir: [8858],
    ocirc: [244],
    ocy: [1086],
    odash: [8861],
    odblac: [337],
    odiv: [10808],
    odot: [8857],
    odsold: [10684],
    oelig: [339],
    ofcir: [10687],
    ofr: [120108],
    ogon: [731],
    ograve: [242],
    ogt: [10689],
    ohbar: [10677],
    ohm: [937],
    oint: [8750],
    olarr: [8634],
    olcir: [10686],
    olcross: [10683],
    oline: [8254],
    olt: [10688],
    omacr: [333],
    omega: [969],
    omicron: [959],
    omid: [10678],
    ominus: [8854],
    oopf: [120160],
    opar: [10679],
    operp: [10681],
    oplus: [8853],
    or: [8744],
    orarr: [8635],
    ord: [10845],
    order: [8500],
    orderof: [8500],
    ordf: [170],
    ordm: [186],
    origof: [8886],
    oror: [10838],
    orslope: [10839],
    orv: [10843],
    oscr: [8500],
    oslash: [248],
    osol: [8856],
    otilde: [245],
    otimes: [8855],
    otimesas: [10806],
    ouml: [246],
    ovbar: [9021],
    par: [8741],
    para: [182],
    parallel: [8741],
    parsim: [10995],
    parsl: [11005],
    part: [8706],
    pcy: [1087],
    percnt: [37],
    period: [46],
    permil: [8240],
    perp: [8869],
    pertenk: [8241],
    pfr: [120109],
    phi: [966],
    phiv: [981],
    phmmat: [8499],
    phone: [9742],
    pi: [960],
    pitchfork: [8916],
    piv: [982],
    planck: [8463],
    planckh: [8462],
    plankv: [8463],
    plus: [43],
    plusacir: [10787],
    plusb: [8862],
    pluscir: [10786],
    plusdo: [8724],
    plusdu: [10789],
    pluse: [10866],
    plusmn: [177],
    plussim: [10790],
    plustwo: [10791],
    pm: [177],
    pointint: [10773],
    popf: [120161],
    pound: [163],
    pr: [8826],
    prE: [10931],
    prap: [10935],
    prcue: [8828],
    pre: [10927],
    prec: [8826],
    precapprox: [10935],
    preccurlyeq: [8828],
    preceq: [10927],
    precnapprox: [10937],
    precneqq: [10933],
    precnsim: [8936],
    precsim: [8830],
    prime: [8242],
    primes: [8473],
    prnE: [10933],
    prnap: [10937],
    prnsim: [8936],
    prod: [8719],
    profalar: [9006],
    profline: [8978],
    profsurf: [8979],
    prop: [8733],
    propto: [8733],
    prsim: [8830],
    prurel: [8880],
    pscr: [120005],
    psi: [968],
    puncsp: [8200],
    qfr: [120110],
    qint: [10764],
    qopf: [120162],
    qprime: [8279],
    qscr: [120006],
    quaternions: [8461],
    quatint: [10774],
    quest: [63],
    questeq: [8799],
    quot: [34],
    rAarr: [8667],
    rArr: [8658],
    rAtail: [10524],
    rBarr: [10511],
    rHar: [10596],
    race: [8765, 817],
    racute: [341],
    radic: [8730],
    raemptyv: [10675],
    rang: [10217],
    rangd: [10642],
    range: [10661],
    rangle: [10217],
    raquo: [187],
    rarr: [8594],
    rarrap: [10613],
    rarrb: [8677],
    rarrbfs: [10528],
    rarrc: [10547],
    rarrfs: [10526],
    rarrhk: [8618],
    rarrlp: [8620],
    rarrpl: [10565],
    rarrsim: [10612],
    rarrtl: [8611],
    rarrw: [8605],
    ratail: [10522],
    ratio: [8758],
    rationals: [8474],
    rbarr: [10509],
    rbbrk: [10099],
    rbrace: [125],
    rbrack: [93],
    rbrke: [10636],
    rbrksld: [10638],
    rbrkslu: [10640],
    rcaron: [345],
    rcedil: [343],
    rceil: [8969],
    rcub: [125],
    rcy: [1088],
    rdca: [10551],
    rdldhar: [10601],
    rdquo: [8221],
    rdquor: [8221],
    rdsh: [8627],
    real: [8476],
    realine: [8475],
    realpart: [8476],
    reals: [8477],
    rect: [9645],
    reg: [174],
    rfisht: [10621],
    rfloor: [8971],
    rfr: [120111],
    rhard: [8641],
    rharu: [8640],
    rharul: [10604],
    rho: [961],
    rhov: [1009],
    rightarrow: [8594],
    rightarrowtail: [8611],
    rightharpoondown: [8641],
    rightharpoonup: [8640],
    rightleftarrows: [8644],
    rightleftharpoons: [8652],
    rightrightarrows: [8649],
    rightsquigarrow: [8605],
    rightthreetimes: [8908],
    ring: [730],
    risingdotseq: [8787],
    rlarr: [8644],
    rlhar: [8652],
    rlm: [8207],
    rmoust: [9137],
    rmoustache: [9137],
    rnmid: [10990],
    roang: [10221],
    roarr: [8702],
    robrk: [10215],
    ropar: [10630],
    ropf: [120163],
    roplus: [10798],
    rotimes: [10805],
    rpar: [41],
    rpargt: [10644],
    rppolint: [10770],
    rrarr: [8649],
    rsaquo: [8250],
    rscr: [120007],
    rsh: [8625],
    rsqb: [93],
    rsquo: [8217],
    rsquor: [8217],
    rthree: [8908],
    rtimes: [8906],
    rtri: [9657],
    rtrie: [8885],
    rtrif: [9656],
    rtriltri: [10702],
    ruluhar: [10600],
    rx: [8478],
    sacute: [347],
    sbquo: [8218],
    sc: [8827],
    scE: [10932],
    scap: [10936],
    scaron: [353],
    sccue: [8829],
    sce: [10928],
    scedil: [351],
    scirc: [349],
    scnE: [10934],
    scnap: [10938],
    scnsim: [8937],
    scpolint: [10771],
    scsim: [8831],
    scy: [1089],
    sdot: [8901],
    sdotb: [8865],
    sdote: [10854],
    seArr: [8664],
    searhk: [10533],
    searr: [8600],
    searrow: [8600],
    sect: [167],
    semi: [59],
    seswar: [10537],
    setminus: [8726],
    setmn: [8726],
    sext: [10038],
    sfr: [120112],
    sfrown: [8994],
    sharp: [9839],
    shchcy: [1097],
    shcy: [1096],
    shortmid: [8739],
    shortparallel: [8741],
    shy: [173],
    sigma: [963],
    sigmaf: [962],
    sigmav: [962],
    sim: [8764],
    simdot: [10858],
    sime: [8771],
    simeq: [8771],
    simg: [10910],
    simgE: [10912],
    siml: [10909],
    simlE: [10911],
    simne: [8774],
    simplus: [10788],
    simrarr: [10610],
    slarr: [8592],
    smallsetminus: [8726],
    smashp: [10803],
    smeparsl: [10724],
    smid: [8739],
    smile: [8995],
    smt: [10922],
    smte: [10924],
    smtes: [10924, 65024],
    softcy: [1100],
    sol: [47],
    solb: [10692],
    solbar: [9023],
    sopf: [120164],
    spades: [9824],
    spadesuit: [9824],
    spar: [8741],
    sqcap: [8851],
    sqcaps: [8851, 65024],
    sqcup: [8852],
    sqcups: [8852, 65024],
    sqsub: [8847],
    sqsube: [8849],
    sqsubset: [8847],
    sqsubseteq: [8849],
    sqsup: [8848],
    sqsupe: [8850],
    sqsupset: [8848],
    sqsupseteq: [8850],
    squ: [9633],
    square: [9633],
    squarf: [9642],
    squf: [9642],
    srarr: [8594],
    sscr: [120008],
    ssetmn: [8726],
    ssmile: [8995],
    sstarf: [8902],
    star: [9734],
    starf: [9733],
    straightepsilon: [1013],
    straightphi: [981],
    strns: [175],
    sub: [8834],
    subE: [10949],
    subdot: [10941],
    sube: [8838],
    subedot: [10947],
    submult: [10945],
    subnE: [10955],
    subne: [8842],
    subplus: [10943],
    subrarr: [10617],
    subset: [8834],
    subseteq: [8838],
    subseteqq: [10949],
    subsetneq: [8842],
    subsetneqq: [10955],
    subsim: [10951],
    subsub: [10965],
    subsup: [10963],
    succ: [8827],
    succapprox: [10936],
    succcurlyeq: [8829],
    succeq: [10928],
    succnapprox: [10938],
    succneqq: [10934],
    succnsim: [8937],
    succsim: [8831],
    sum: [8721],
    sung: [9834],
    sup: [8835],
    sup1: [185],
    sup2: [178],
    sup3: [179],
    supE: [10950],
    supdot: [10942],
    supdsub: [10968],
    supe: [8839],
    supedot: [10948],
    suphsol: [10185],
    suphsub: [10967],
    suplarr: [10619],
    supmult: [10946],
    supnE: [10956],
    supne: [8843],
    supplus: [10944],
    supset: [8835],
    supseteq: [8839],
    supseteqq: [10950],
    supsetneq: [8843],
    supsetneqq: [10956],
    supsim: [10952],
    supsub: [10964],
    supsup: [10966],
    swArr: [8665],
    swarhk: [10534],
    swarr: [8601],
    swarrow: [8601],
    swnwar: [10538],
    szlig: [223],
    target: [8982],
    tau: [964],
    tbrk: [9140],
    tcaron: [357],
    tcedil: [355],
    tcy: [1090],
    tdot: [8411],
    telrec: [8981],
    tfr: [120113],
    there4: [8756],
    therefore: [8756],
    theta: [952],
    thetasym: [977],
    thetav: [977],
    thickapprox: [8776],
    thicksim: [8764],
    thinsp: [8201],
    thkap: [8776],
    thksim: [8764],
    thorn: [254],
    tilde: [732],
    times: [215],
    timesb: [8864],
    timesbar: [10801],
    timesd: [10800],
    tint: [8749],
    toea: [10536],
    top: [8868],
    topbot: [9014],
    topcir: [10993],
    topf: [120165],
    topfork: [10970],
    tosa: [10537],
    tprime: [8244],
    trade: [8482],
    triangle: [9653],
    triangledown: [9663],
    triangleleft: [9667],
    trianglelefteq: [8884],
    triangleq: [8796],
    triangleright: [9657],
    trianglerighteq: [8885],
    tridot: [9708],
    trie: [8796],
    triminus: [10810],
    triplus: [10809],
    trisb: [10701],
    tritime: [10811],
    trpezium: [9186],
    tscr: [120009],
    tscy: [1094],
    tshcy: [1115],
    tstrok: [359],
    twixt: [8812],
    twoheadleftarrow: [8606],
    twoheadrightarrow: [8608],
    uArr: [8657],
    uHar: [10595],
    uacute: [250],
    uarr: [8593],
    ubrcy: [1118],
    ubreve: [365],
    ucirc: [251],
    ucy: [1091],
    udarr: [8645],
    udblac: [369],
    udhar: [10606],
    ufisht: [10622],
    ufr: [120114],
    ugrave: [249],
    uharl: [8639],
    uharr: [8638],
    uhblk: [9600],
    ulcorn: [8988],
    ulcorner: [8988],
    ulcrop: [8975],
    ultri: [9720],
    umacr: [363],
    uml: [168],
    uogon: [371],
    uopf: [120166],
    uparrow: [8593],
    updownarrow: [8597],
    upharpoonleft: [8639],
    upharpoonright: [8638],
    uplus: [8846],
    upsi: [965],
    upsih: [978],
    upsilon: [965],
    upuparrows: [8648],
    urcorn: [8989],
    urcorner: [8989],
    urcrop: [8974],
    uring: [367],
    urtri: [9721],
    uscr: [120010],
    utdot: [8944],
    utilde: [361],
    utri: [9653],
    utrif: [9652],
    uuarr: [8648],
    uuml: [252],
    uwangle: [10663],
    vArr: [8661],
    vBar: [10984],
    vBarv: [10985],
    vDash: [8872],
    vangrt: [10652],
    varepsilon: [1013],
    varkappa: [1008],
    varnothing: [8709],
    varphi: [981],
    varpi: [982],
    varpropto: [8733],
    varr: [8597],
    varrho: [1009],
    varsigma: [962],
    varsubsetneq: [8842, 65024],
    varsubsetneqq: [10955, 65024],
    varsupsetneq: [8843, 65024],
    varsupsetneqq: [10956, 65024],
    vartheta: [977],
    vartriangleleft: [8882],
    vartriangleright: [8883],
    vcy: [1074],
    vdash: [8866],
    vee: [8744],
    veebar: [8891],
    veeeq: [8794],
    vellip: [8942],
    verbar: [124],
    vert: [124],
    vfr: [120115],
    vltri: [8882],
    vnsub: [8834, 8402],
    vnsup: [8835, 8402],
    vopf: [120167],
    vprop: [8733],
    vrtri: [8883],
    vscr: [120011],
    vsubnE: [10955, 65024],
    vsubne: [8842, 65024],
    vsupnE: [10956, 65024],
    vsupne: [8843, 65024],
    vzigzag: [10650],
    wcirc: [373],
    wedbar: [10847],
    wedge: [8743],
    wedgeq: [8793],
    weierp: [8472],
    wfr: [120116],
    wopf: [120168],
    wp: [8472],
    wr: [8768],
    wreath: [8768],
    wscr: [120012],
    xcap: [8898],
    xcirc: [9711],
    xcup: [8899],
    xdtri: [9661],
    xfr: [120117],
    xhArr: [10234],
    xharr: [10231],
    xi: [958],
    xlArr: [10232],
    xlarr: [10229],
    xmap: [10236],
    xnis: [8955],
    xodot: [10752],
    xopf: [120169],
    xoplus: [10753],
    xotime: [10754],
    xrArr: [10233],
    xrarr: [10230],
    xscr: [120013],
    xsqcup: [10758],
    xuplus: [10756],
    xutri: [9651],
    xvee: [8897],
    xwedge: [8896],
    yacute: [253],
    yacy: [1103],
    ycirc: [375],
    ycy: [1099],
    yen: [165],
    yfr: [120118],
    yicy: [1111],
    yopf: [120170],
    yscr: [120014],
    yucy: [1102],
    yuml: [255],
    zacute: [378],
    zcaron: [382],
    zcy: [1079],
    zdot: [380],
    zeetrf: [8488],
    zeta: [950],
    zfr: [120119],
    zhcy: [1078],
    zigrarr: [8669],
    zopf: [120171],
    zscr: [120015],
    zwj: [8205],
    zwnj: [8204]
  };

});
enifed('simple-html-tokenizer/char-refs/min', ['exports'], function (exports) {

  'use strict';

  exports['default'] = {
    quot: [34],
    amp: [38],
    apos: [39],
    lt: [60],
    gt: [62]
  };

});
enifed('simple-html-tokenizer/entity-parser', ['exports'], function (exports) {

  'use strict';

  function EntityParser(namedCodepoints) {
    this.namedCodepoints = namedCodepoints;
  }

  EntityParser.prototype.parse = function (tokenizer) {
    var input = tokenizer.input.slice(tokenizer["char"]);
    var matches = input.match(/^#(?:x|X)([0-9A-Fa-f]+);/);
    if (matches) {
      tokenizer["char"] += matches[0].length;
      return String.fromCharCode(parseInt(matches[1], 16));
    }
    matches = input.match(/^#([0-9]+);/);
    if (matches) {
      tokenizer["char"] += matches[0].length;
      return String.fromCharCode(parseInt(matches[1], 10));
    }
    matches = input.match(/^([A-Za-z]+);/);
    if (matches) {
      var codepoints = this.namedCodepoints[matches[1]];
      if (codepoints) {
        tokenizer["char"] += matches[0].length;
        for (var i = 0, buffer = ''; i < codepoints.length; i++) {
          buffer += String.fromCharCode(codepoints[i]);
        }
        return buffer;
      }
    }
  };

  exports['default'] = EntityParser;

});
enifed('simple-html-tokenizer/generate', ['exports', './generator'], function (exports, Generator) {

  'use strict';



  exports['default'] = generate;
  function generate(tokens) {
    var generator = new Generator['default']();
    return generator.generate(tokens);
  }

});
enifed('simple-html-tokenizer/generator', ['exports'], function (exports) {

  'use strict';

  var escape = (function () {
    var test = /[&<>"'`]/;
    var replace = /[&<>"'`]/g;
    var map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#x27;",
      "`": "&#x60;"
    };
    function escapeChar(char) {
      return map["char"];
    }
    return function escape(string) {
      if (!test.test(string)) {
        return string;
      }
      return string.replace(replace, escapeChar);
    };
  })();

  function Generator() {
    this.escape = escape;
  }

  Generator.prototype = {
    generate: function (tokens) {
      var buffer = "";
      var token;
      for (var i = 0; i < tokens.length; i++) {
        token = tokens[i];
        buffer += this[token.type](token);
      }
      return buffer;
    },

    escape: function (text) {
      var unsafeCharsMap = this.unsafeCharsMap;
      return text.replace(this.unsafeChars, function (char) {
        return unsafeCharsMap["char"] || char;
      });
    },

    StartTag: function (token) {
      var out = "<";
      out += token.tagName;

      if (token.attributes.length) {
        out += " " + this.Attributes(token.attributes);
      }

      out += ">";

      return out;
    },

    EndTag: function (token) {
      return "</" + token.tagName + ">";
    },

    Chars: function (token) {
      return this.escape(token.chars);
    },

    Comment: function (token) {
      return "<!--" + token.chars + "-->";
    },

    Attributes: function (attributes) {
      var out = [],
          attribute;

      for (var i = 0, l = attributes.length; i < l; i++) {
        attribute = attributes[i];

        out.push(this.Attribute(attribute[0], attribute[1]));
      }

      return out.join(" ");
    },

    Attribute: function (name, value) {
      var attrString = name;

      if (value) {
        value = this.escape(value);
        attrString += "=\"" + value + "\"";
      }

      return attrString;
    }
  };

  exports['default'] = Generator;

});
enifed('simple-html-tokenizer/tokenize', ['exports', './tokenizer', './entity-parser', './char-refs/full'], function (exports, Tokenizer, EntityParser, namedCodepoints) {

  'use strict';



  exports['default'] = tokenize;
  function tokenize(input) {
    var tokenizer = new Tokenizer['default'](input, new EntityParser['default'](namedCodepoints['default']));
    return tokenizer.tokenize();
  }

});
enifed('simple-html-tokenizer/tokenizer', ['exports', './utils', './tokens'], function (exports, utils, ___tokens) {

  'use strict';

  function Tokenizer(input, entityParser) {
    this.input = utils.preprocessInput(input);
    this.entityParser = entityParser;
    this["char"] = 0;
    this.line = 1;
    this.column = 0;

    this.state = 'data';
    this.token = null;
  }

  Tokenizer.prototype = {
    tokenize: function () {
      var tokens = [],
          token;

      while (true) {
        token = this.lex();
        if (token === 'EOF') {
          break;
        }
        if (token) {
          tokens.push(token);
        }
      }

      if (this.token) {
        tokens.push(this.token);
      }

      return tokens;
    },

    tokenizePart: function (string) {
      this.input += utils.preprocessInput(string);
      var tokens = [],
          token;

      while (this["char"] < this.input.length) {
        token = this.lex();
        if (token) {
          tokens.push(token);
        }
      }

      this.tokens = (this.tokens || []).concat(tokens);
      return tokens;
    },

    tokenizeEOF: function () {
      var token = this.token;
      if (token) {
        this.token = null;
        return token;
      }
    },

    createTag: function (Type, char) {
      var lastToken = this.token;
      this.token = new Type(char);
      this.state = 'tagName';
      return lastToken;
    },

    addToTagName: function (char) {
      this.token.tagName += char;
    },

    selfClosing: function () {
      this.token.selfClosing = true;
    },

    createAttribute: function (char) {
      this._currentAttribute = [char.toLowerCase(), '', null];
      this.token.attributes.push(this._currentAttribute);
      this.state = 'attributeName';
    },

    addToAttributeName: function (char) {
      this._currentAttribute[0] += char;
    },

    markAttributeQuoted: function (value) {
      this._currentAttribute[2] = value;
    },

    finalizeAttributeValue: function () {
      if (this._currentAttribute) {
        if (this._currentAttribute[2] === null) {
          this._currentAttribute[2] = false;
        }
        this._currentAttribute = undefined;
      }
    },

    addToAttributeValue: function (char) {
      this._currentAttribute[1] = this._currentAttribute[1] || '';
      this._currentAttribute[1] += char;
    },

    createComment: function () {
      var lastToken = this.token;
      this.token = new ___tokens.Comment();
      this.state = 'commentStart';
      return lastToken;
    },

    addToComment: function (char) {
      this.addChar(char);
    },

    addChar: function (char) {
      this.token.chars += char;
    },

    finalizeToken: function () {
      if (this.token.type === 'StartTag') {
        this.finalizeAttributeValue();
      }
      return this.token;
    },

    emitData: function () {
      this.addLocInfo(this.line, this.column - 1);
      var lastToken = this.token;
      this.token = null;
      this.state = 'tagOpen';
      return lastToken;
    },

    emitToken: function () {
      this.addLocInfo();
      var lastToken = this.finalizeToken();
      this.token = null;
      this.state = 'data';
      return lastToken;
    },

    addData: function (char) {
      if (this.token === null) {
        this.token = new ___tokens.Chars();
        this.markFirst();
      }

      this.addChar(char);
    },

    markFirst: function (line, column) {
      this.firstLine = line === 0 ? 0 : line || this.line;
      this.firstColumn = column === 0 ? 0 : column || this.column;
    },

    addLocInfo: function (line, column) {
      if (!this.token) {
        return;
      }
      this.token.firstLine = this.firstLine;
      this.token.firstColumn = this.firstColumn;
      this.token.lastLine = line === 0 ? 0 : line || this.line;
      this.token.lastColumn = column === 0 ? 0 : column || this.column;
    },

    consumeCharRef: function () {
      return this.entityParser.parse(this);
    },

    lex: function () {
      var char = this.input.charAt(this["char"]++);

      if (char) {
        if (char === '\n') {
          this.line++;
          this.column = 0;
        } else {
          this.column++;
        }
        return this.states[this.state].call(this, char);
      } else {
        this.addLocInfo(this.line, this.column);
        return 'EOF';
      }
    },

    states: {
      data: function (char) {
        if (char === '<') {
          var chars = this.emitData();
          this.markFirst();
          return chars;
        } else if (char === '&') {
          this.addData(this.consumeCharRef() || '&');
        } else {
          this.addData(char);
        }
      },

      tagOpen: function (char) {
        if (char === '!') {
          this.state = 'markupDeclaration';
        } else if (char === '/') {
          this.state = 'endTagOpen';
        } else if (utils.isAlpha(char)) {
          return this.createTag(___tokens.StartTag, char.toLowerCase());
        }
      },

      markupDeclaration: function (char) {
        if (char === '-' && this.input.charAt(this["char"]) === '-') {
          this["char"]++;
          this.createComment();
        }
      },

      commentStart: function (char) {
        if (char === '-') {
          this.state = 'commentStartDash';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.addToComment(char);
          this.state = 'comment';
        }
      },

      commentStartDash: function (char) {
        if (char === '-') {
          this.state = 'commentEnd';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.addToComment('-');
          this.state = 'comment';
        }
      },

      comment: function (char) {
        if (char === '-') {
          this.state = 'commentEndDash';
        } else {
          this.addToComment(char);
        }
      },

      commentEndDash: function (char) {
        if (char === '-') {
          this.state = 'commentEnd';
        } else {
          this.addToComment('-' + char);
          this.state = 'comment';
        }
      },

      commentEnd: function (char) {
        if (char === '>') {
          return this.emitToken();
        } else {
          this.addToComment('--' + char);
          this.state = 'comment';
        }
      },

      tagName: function (char) {
        if (utils.isSpace(char)) {
          this.state = 'beforeAttributeName';
        } else if (char === '/') {
          this.state = 'selfClosingStartTag';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.addToTagName(char);
        }
      },

      beforeAttributeName: function (char) {
        if (utils.isSpace(char)) {
          return;
        } else if (char === '/') {
          this.state = 'selfClosingStartTag';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.createAttribute(char);
        }
      },

      attributeName: function (char) {
        if (utils.isSpace(char)) {
          this.state = 'afterAttributeName';
        } else if (char === '/') {
          this.state = 'selfClosingStartTag';
        } else if (char === '=') {
          this.state = 'beforeAttributeValue';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.addToAttributeName(char);
        }
      },

      afterAttributeName: function (char) {
        if (utils.isSpace(char)) {
          return;
        } else if (char === '/') {
          this.state = 'selfClosingStartTag';
        } else if (char === '=') {
          this.state = 'beforeAttributeValue';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.finalizeAttributeValue();
          this.createAttribute(char);
        }
      },

      beforeAttributeValue: function (char) {
        if (utils.isSpace(char)) {
          return;
        } else if (char === '"') {
          this.state = 'attributeValueDoubleQuoted';
          this.markAttributeQuoted(true);
        } else if (char === '\'') {
          this.state = 'attributeValueSingleQuoted';
          this.markAttributeQuoted(true);
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.state = 'attributeValueUnquoted';
          this.markAttributeQuoted(false);
          this.addToAttributeValue(char);
        }
      },

      attributeValueDoubleQuoted: function (char) {
        if (char === '"') {
          this.finalizeAttributeValue();
          this.state = 'afterAttributeValueQuoted';
        } else if (char === '&') {
          this.addToAttributeValue(this.consumeCharRef('"') || '&');
        } else {
          this.addToAttributeValue(char);
        }
      },

      attributeValueSingleQuoted: function (char) {
        if (char === '\'') {
          this.finalizeAttributeValue();
          this.state = 'afterAttributeValueQuoted';
        } else if (char === '&') {
          this.addToAttributeValue(this.consumeCharRef('\'') || '&');
        } else {
          this.addToAttributeValue(char);
        }
      },

      attributeValueUnquoted: function (char) {
        if (utils.isSpace(char)) {
          this.finalizeAttributeValue();
          this.state = 'beforeAttributeName';
        } else if (char === '&') {
          this.addToAttributeValue(this.consumeCharRef('>') || '&');
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this.addToAttributeValue(char);
        }
      },

      afterAttributeValueQuoted: function (char) {
        if (utils.isSpace(char)) {
          this.state = 'beforeAttributeName';
        } else if (char === '/') {
          this.state = 'selfClosingStartTag';
        } else if (char === '>') {
          return this.emitToken();
        } else {
          this["char"]--;
          this.state = 'beforeAttributeName';
        }
      },

      selfClosingStartTag: function (char) {
        if (char === '>') {
          this.selfClosing();
          return this.emitToken();
        } else {
          this["char"]--;
          this.state = 'beforeAttributeName';
        }
      },

      endTagOpen: function (char) {
        if (utils.isAlpha(char)) {
          this.createTag(___tokens.EndTag, char.toLowerCase());
        }
      }
    }
  };

  exports['default'] = Tokenizer;

});
enifed('simple-html-tokenizer/tokens', ['exports'], function (exports) {

  'use strict';

  exports.StartTag = StartTag;
  exports.EndTag = EndTag;
  exports.Chars = Chars;
  exports.Comment = Comment;

  function StartTag(tagName, attributes, selfClosing) {
    this.type = 'StartTag';
    this.tagName = tagName || '';
    this.attributes = attributes || [];
    this.selfClosing = selfClosing === true;
  }

  function EndTag(tagName) {
    this.type = 'EndTag';
    this.tagName = tagName || '';
  }

  function Chars(chars) {
    this.type = 'Chars';
    this.chars = chars || '';
  }

  function Comment(chars) {
    this.type = 'Comment';
    this.chars = chars || '';
  }

});
enifed('simple-html-tokenizer/utils', ['exports'], function (exports) {

  'use strict';

  exports.isSpace = isSpace;
  exports.isAlpha = isAlpha;
  exports.preprocessInput = preprocessInput;

  function isSpace(char) {
    return /[\t\n\f ]/.test(char);
  }

  function isAlpha(char) {
    return /[A-Za-z]/.test(char);
  }

  function preprocessInput(input) {
    return input.replace(/\r\n?/g, "\n");
  }

});
requireModule("ember-debug");
requireModule("ember-template-compiler");

})();
;
if (typeof exports === "object") {
  module.exports = Ember.__loader.require("ember-template-compiler");
 }//# sourceMappingURL=ember-template-compiler.map