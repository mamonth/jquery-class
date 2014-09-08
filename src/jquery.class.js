/*!
 * jQuery Class Plugin v0.1.1
 * https://github.com/mamonth/jquery-class
 *
 * Modified version of can.Construct from CanJs (http://canjs.com/),
 * which is updated version of jQuery.Class from JavaScriptMVC
 * (http://javascriptmvc.com/), which is modified version of
 * John Resig's class ( http://ejohn.org/blog/simple-javascript-inheritance/ )
 *
 * @author Andrew Tereshko <andrew.tereshko@gmail.com>
 *
 * @license MIT
 */
(function( factory ) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory;
    } else {
        // Browser globals
        factory( jQuery );
    }
}( function ($) {

    'use strict';

    /**
     * First of all we need string tools ( namespaces & etc. )
     * Taken from CanJs.util.string
     * https://github.com/bitovi/canjs/blob/master/util/string/string.js
     *
     */
    var strColons = /\=\=/,
        strWords = /([A-Z]+)([A-Z][a-z])/g,
        strLowUp = /([a-z\d])([A-Z])/g,
        strDash = /([a-z\d])([A-Z])/g,
        getNext = function (obj, prop, add) {
            var result = obj[prop];
            if (result === undefined && add === true) {
                result = obj[prop] = {};
            }
            return result;
        },
        isContainer = function (current) {
            return /^f|^o/.test(typeof current);
        },
        underscore  = function (s) {
            return s.replace(strColons, '/')
                .replace(strWords, '$1_$2')
                .replace(strLowUp, '$1_$2')
                .replace(strDash, '_')
                .toLowerCase();
        },
        getObjectFromString = function (name, roots, add) {

            // The parts of the name we are looking up
            // `['App','Models','Recipe']`
            var parts = name ? name.split('.') : [],
                length = parts.length,
                current, r = 0,
                i, container, rootsLength;
            // Make sure roots is an `array`.
            roots = $.isArray(roots) ? roots : [roots || window];
            rootsLength = roots.length;
            if (!length) {
                return roots[0];
            }
            // For each root, mark it as current.
            for (r; r < rootsLength; r++) {
                current = roots[r];
                container = undefined;
                // Walk current to the 2nd to last object or until there
                // is not a container.
                for (i = 0; i < length && isContainer(current); i++) {
                    container = current;
                    current = getNext(container, parts[i]);
                }
                // If we found property break cycle
                if (container !== undefined && current !== undefined) {
                    break;
                }
            }
            // Remove property from found container
            if (add === false && current !== undefined) {
                delete container[parts[i - 1]];
            }
            // When adding property add it to the first root
            if (add === true && current === undefined) {
                current = roots[0];
                for (i = 0; i < length && isContainer(current); i++) {
                    current = getNext(current, parts[i], true);
                }
            }
            return current;
        },
        fnTest = /xyz/.test(function () {
            return this.xyz;
        }) ? /\b_super\b/ : /.*/,
        extendConstr = function() {
            var fns = arguments;
            return function newConstr(){
                var self = {};
                for (var i=0; i<fns.length; i++)
                    fns[i].apply(self, arguments);
                return self;
            }
        },
        /**
         * A private flag used to initialize a new class instance without
         * initializing it's bindings.
         *
         * @type {number}
         */
        initializing = 0;


    /**
     * @class jQuery.Class
     * @constructor
     */
    $.Class = function(){

        if( arguments.length ) return $.Class.extend.apply( $.Class, arguments );
    };

    /**
     * @static
     */
    $.extend( $.Class, {
        /**
         * @var {Boolean} if false - new instance of constructor, true - constructor extends
         * @memberOf jQuery.Class
         */
        constructorExtends: true,

        /**
         * Returns an instance of `jQuery.Class`. This method
         * can be overridden to return a cached instance.
         *
         * @function newInstance
         * @memberOf jQuery.Class
         * @constructs jQuery.Class
         *
         * @param {...*} [args] arguments that get passed to [jQuery.Class::setup] and [jQuery.Class::init]. Note
         * that if [jQuery.Class::setup] returns an array, those arguments will be passed to [jQuery.Class::init]
         * instead.
         *
         * @return {jQuery.Class} instance of the class
         *
         * @description
         * Creates a new instance of the constructor function. This method is useful for creating new instances
         * with arbitrary parameters. Typically, however, you will simply want to call the constructor with the
         * __new__ operator.
         *
         * @example
         * //The following creates a `Person` Construct and then creates a new instance of Person,
         * //using `apply` on newInstance to pass arbitrary parameters.
         *
         * var Person = $.Class.extend({
		 *   init : function(first, middle, last) {
		 *     this.first = first;
		 *     this.middle = middle;
		 *     this.last = last;
		 *   }
		 * });
         *
         * var args = ["Justin","Barry","Meyer"],
         *     justin = new Person.newInstance.apply(null, args);
         */
        newInstance: function () {
            // Get a raw instance object (`init` is not called).
            var inst = this.instance(),
                args;
            // Call `setup` if there is a `setup`
            if (inst.setup) {
                args = inst.setup.apply(inst, arguments);
            }
            // Call `init` if there is an `init`
            // If `setup` returned `args`, use those as the arguments
            if (inst.init) {
                inst.init.apply(inst, args || arguments);
            }
            return inst;
        },

        /**
         * Overwrites an object with methods.
         *
         * @function _inherit
         * @memberof jQuery.Class
         * @private
         *
         * @param {Object} newProps New properties to add
         * @param {Object} oldProps Where the old properties might be (used with `super`)
         * @param {Object} addTo What we are adding to
         */
        _inherit: function (newProps, oldProps, addTo) {

            addTo = addTo || newProps;

            for (var property in newProps) {
                $.Class._overwrite(addTo, oldProps, property, newProps[ property ]);
            }
        },

        /**
         * Used for overwriting a single property. Should be used for patching other objects.
         *
         * @function _overwrite
         * @memberOf jQuery.Class
         * @private
         *
         * @param {object} target
         * @param {object} parent
         * @param {string} property
         * @param {*} val
         */
        _overwrite: function ( target, parent, property, val) {

            // _super method implementation
            // overwrites a single property so it can still call super
            target[ property ] = $.isFunction( val ) && $.isFunction( parent[ property ] ) && fnTest.test(val) ? function( name, fn ){

                return function () {
                    var tmp = this._super,
                        ret;

                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = parent[ property ];

                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    ret = fn.apply(this, arguments);

                    this._super = tmp;

                    return ret;
                };

            }( property, val ) : val;
        },

        /**
         * Perform initialization logic for a constructor function.
         *
         * @function setup
         * @memberOf jQuery.Class
         *
         * @param {constructor} base The base constructor that is being inherited from.
         * @param {String} fullName The name of the new constructor.
         * @param {Object} staticProps The static properties of the new constructor.
         * @param {Object} protoProps The prototype properties of the new constructor.
         *
         * @description
         * A static `setup` method provides inheritable setup functionality
         * for a Constructor function.
         *
         * The static `setup` method is called immediately after a constructor
         * function is created and
         * set to inherit from its base constructor. It is useful for setting up
         * additional inheritance work.
         * Do not confuse this with the prototype `[can.Construct::setup]` method.
         *
         * @example
         * // Creating a Group constructor function.  Any constructor functions
         * // that inherit from Group will be added to `Group.childGroups`.
         *
         * var Group = jQuery.Class.extend({
		 *       setup: function(Construct, fullName, staticProps, protoProps){
		 *         this.childGroups = [];
		 *         if(Construct !== jQuery.Class){
		 *           this.childGroups(Construct)
		 *         }
		 *         Construct.setup.apply(this, arguments)
		 *       }
		 *     },{})
         *     var Flock = Group.extend(...)
         *     Group.childGroups[0] //-> Flock
         *
         * @example
         * // Setup deeply extends the static `defaults` property of the base constructor
         * // with properties of the inheriting constructor.
         *
         * var Parent = jQuery.Class.extend({
		 *   defaults : {
		 *     parentProp: 'foo'
		 *   }
		 * },{})
         *
         * var Child = Parent.extend({
		 *   defaults : {
		 *     childProp : 'bar'
		 *   }
		 * },{}
         *
         * Child.defaults // {parentProp: 'foo', 'childProp': 'bar'}
         *
         * @example
         * // This `Parent` class adds a reference to its base class to itself, and
         * // so do all the classes that inherit from it.
         *
         * var Parent = jQuery.Class.extend({
		 *   setup : function(base, fullName, staticProps, protoProps){
		 *     this.base = base;
		 *
		 *     // call base functionality
		 *     jQuery.Class.setup.apply(this, arguments)
		 *   }
		 * },{});
         *
         * Parent.base; // jQuery.Class
         *
         * var Child = Parent.extend({});
         *
         * Child.base; // Parent
         */
        setup: function (base, fullName, staticProps, protoProps ) {

            this.defaults = $.extend(true, {}, base.defaults, this.defaults);
        },

        /**
         * Create's a new `class` instance without initializing by setting the
         * `initializing` flag.
         *
         * @return {jQuery.Class}
         */
        instance: function () {
            // Prevents running `init`.
            initializing = 1;
            var inst = new this();
            // Allow running `init`.
            initializing = 0;
            return inst;
        },

        /**
         * Extends `can.Construct`, or constructor functions derived from `can.Construct`,
         * to create a new constructor function.
         *
         * @function extend
         * @memberOf jQuery.Class
         *
         *
         * @param {string} [name] Creates the necessary properties and
         * objects that point from the `window` to the created constructor function. The following:
         *
         *     jQuery.Class.extend("company.project.Constructor",{})
         *
         * creates a `company` object on window if it does not find one, a
         * `project` object on `company` if it does not find one, and it will set the
         * `Constructor` property on the `project` object to point to the constructor function.
         *
         * Finally, it sets "company.project.Constructor" as [jQuery.Class.fullName fullName]
         * and "Constructor" as [jQuery.Class.shortName shortName].
         *
         * @param {object} [staticProperties] Properties that are added the constructor
         * function directly. For example:
         *
         *     var Animal = jQuery.Class.extend({
		 *       findAll: function(){
		 *         return can.ajax({url: "/animals"})
		 *       }
		 *     },{});
         *
         *     Animal.findAll().then(function(json){ ... })
         *
         * The [jQuery.Class.setup static setup] method can be used to
         * specify inheritable behavior when a Constructor function is created.
         *
         * @param {object} instanceProperties Properties that belong to
         * instances made with the constructor. These properties are added to the
         * constructor's `prototype` object. Example:
         *
         *     var Animal = jQuery.Class.extend({
		 *       init: function(name){
		 *         this.name = name;
		 *       },
		 *       sayHi: function(){
		 *         console.log(this.name,"says hi")
		 *       }
		 *     })
         *     var animal = new Animal()
         *     animal.sayHi();
         *
         * The [jQuery.Class::init init] and [jQuery.Class::setup setup] properties
         * are used for initialization.
         *
         * @return {function} The constructor function.
         *
         * @example
         *
         * var Animal = jQuery.Class.extend({
		 *       sayHi: function(){
		 *         console.log("hi")
		 *       }
		 * })
         *
         * var animal = new Animal()
         * animal.sayHi();
         *
         */
        extend: function (name, staticProperties, instanceProperties) {
            var fullName = name,
                klass = staticProperties,
                proto = instanceProperties;

            // Figure out what was passed and normalize it.
            if (typeof fullName !== 'string') {
                proto = klass;
                klass = fullName;
                fullName = null;
            }
            if (!proto) {
                proto = klass;
                klass = null;
            }

            proto = proto || {};

            var _super_class    = this,
                _super          = this.prototype,
                parts, current, _fullName, _shortName, propName, shortName, namespace, prototype;

            // Instantiate a base class (but only create the instance,
            // don't run the init constructor).
            prototype = this.instance();

            // Copy the properties over onto the new prototype.
            $.Class._inherit(proto, _super, prototype);

            // The dummy class constructor.
            function Constructor() {

                // All construction is actually done in the init method.
                if (!initializing) {

                    return ( this === undefined || this.constructor !== Constructor ) && arguments.length && Constructor.constructorExtends ?
                        // We are being called without `new` or we are extending.
                        Constructor.extend.apply(Constructor, arguments) :
                        // We are being called with `new`.
                        Constructor.newInstance.apply(Constructor, arguments);
                }
            }

            // Copy old stuff onto class (can probably be merged w/ inherit)
            for (propName in _super_class) {
                if (_super_class.hasOwnProperty(propName)) {
                    Constructor[propName] = _super_class[propName];
                }
            }

            // Copy new static properties on class.
            $.Class._inherit(klass, _super_class, Constructor);

            // Setup namespaces.
            if (fullName) {

                parts       = fullName.split('.');
                shortName   = parts.pop();
                current     = getObjectFromString( parts.join('.'), window, true );
                namespace   = current;
                _fullName   = underscore(fullName.replace(/\./g, "_"));
                _shortName  = underscore(shortName);

                if (current[shortName]) {

                    throw new Error("There's already something called " + fullName);
                }

                current[shortName] = Constructor;
            }

            // Set things that shouldn't be overwritten.
            Constructor = $.extend(Constructor, {
                constructor: Constructor,
                prototype: prototype,

                /**
                 * The `namespace` property returns the namespace your constructor is in.
                 * This provides a way organize code and ensure globally unique types. The
                 * `namespace` is the [jQuery.Class.fullName fullName] you passed without the [jQuery.Class.shortName shortName].
                 *
                 * @property {String} namespace
                 * @memberOf $.Class
                 *
                 * @example
                 *
                 * jQuery.Class("MyApplication.MyConstructor",{},{});
                 *
                 * MyApplication.MyConstructor.namespace // "MyApplication"
                 */
                namespace: namespace,

                /**
                 * If you pass a name when creating a Construct, the `shortName` property will be set to the
                 * name you passed without the [jQuery.Class.namespace namespace].
                 *
                 * @property {String} shortName
                 * @memberOf jQuery.Class
                 *
                 * @example
                 * jQuery.Class("MyApplication.MyConstructor",{},{});
                 *
                 * MyApplication.MyConstructor.shortName // "MyConstructor"
                 */
                shortName: shortName,
                _shortName: _shortName,

                /**
                 * If you pass a name when creating a Construct, the `fullName` property will be set to
                 * the name you passed. The `fullName` consists of the [can.Construct.namespace namespace] and
                 * the [can.Construct.shortName shortName].
                 *
                 * @property {String} fullName
                 * @memberOf jQuery.Class
                 *
                 * @example
                 *
                 * jQuery.Class("MyApplication.MyConstructor",{},{});
                 *
                 * MyApplication.MyConstructor.fullName  // "MyApplication.MyConstructor"
                 */
                fullName: fullName,
                _fullName: _fullName
            });

            // Dojo and YUI extend undefined
            if (shortName !== undefined) {
                Constructor.shortName = shortName;
            }

            // Make sure our prototype looks nice.
            Constructor.prototype.constructor = Constructor;

            // Call the class `setup` and `init`
            var t = [_super_class].concat( $.makeArray(arguments)),
                args = Constructor.setup.apply(Constructor, t);

            if (Constructor.init) {
                Constructor.init.apply(Constructor, args || t);
            }

            /**
             * @prototype
             * @memberOf jQuery.Class
             */
            return Constructor;

            /**
             * A reference to the constructor function that created the instance. This allows you to access
             * the constructor's static properties from an instance.
             *
             * @property {Object} constructor
             * @memberOf jQuery.Class.prototype
             *
             *
             * @example
             * //This can.Construct has a static counter that counts how many instances have been created:
             *
             * jQuery.Class.extend("Counter", {
			 *     count: 0
			 * }, {
			 *     init: function() {
			 *         this.constructor.count++;
			 *     }
			 * });
             *
             * new Counter();
             * Counter.count; // 1
             *
             */
        }
    });

    /**
     * A setup function for the instantiation of a constructor function.
     *
     * @function setup
     * @memberOf jQuery.Class
     *
     * @param {...*} [args] The arguments passed to the constructor.
     *
     * @return {Array|undefined} If an array is returned, the array's items are passed as
     * arguments to [can.Construct::init init]. The following example always makes
     * sure that init is called with a jQuery wrapped element:
     *
     *     var WidgetFactory = can.Construct.extend({
	 *         setup: function(element){
	 *             return [$(element)]
	 *         }
	 *     })
     *
     *     var MyWidget = WidgetFactory.extend({
	 *         init: function($el){
	 *             $el.html("My Widget!!")
	 *         }
	 *     })
     *
     * Otherwise, the arguments to the
     * constructor are passed to [can.Construct::init] and the return value of `setup` is discarded.
     *
     * @description
     *
     * ## Deciding between `setup` and `init`
     *
     *
     * Usually, you should use [can.Construct::init init] to do your constructor function's initialization.
     * Use `setup` instead for:
     *
     *   - initialization code that you want to run before the inheriting constructor's
     *     `init` method is called.
     *   - initialization code that should run whether or not inheriting constructors
     *     call their base's `init` methods.
     *   - modifying the arguments that will get passed to `init`.
     *
     * @example
     *
     * // This code is a simplified version of using the setup method.
     * // It converts the first argument to a jQuery collection and
     * // extends the controller's defaults with the options that were passed.
     *
     *
     *     var Control = jQuery.Class.extend({
	 *         setup: function(domElement, rawOptions) {
	 *             // set up this.element
	 *             this.element = $(domElement);
	 *
	 *             // set up this.options
	 *             this.options = can.extend({},
	 *                                   this.constructor.defaults,
	 *                                   rawOptions
	 *                                  );
	 *
	 *             // pass this.element and this.options to init.
	 *             return [this.element, this.options];
	 *         }
	 *     });
     *
     */
    $.Class.prototype.setup = function () {};

    /**
     * Called when a new instance of a can.Construct is created.
     *
     * @function init
     * @memberOf jQuery.Class.prototype
     *
     * @param {...*} [args] the arguments passed to the constructor (or the items of the array returned from [jQuery.Class::setup])
     *
     * @description
     * If a prototype `init` method is provided, it is called when a new Construct is created,
     * after [jQuery.Class::setup]. The `init` method is where the bulk of your initialization code
     * should go, and a common thing to do in `init` is to save the arguments passed into the constructor.
     *
     * ## Modified Arguments
     *
     * [jQuery.Class::setup] is able to modify the arguments passed to `init`.
     * If you aren't receiving the exact arguments as those passed to `new Construct(args)`,
     * check to make sure that they aren't being changed by `setup` somewhere along
     * the inheritance chain.
     *
     * @example
     * // First, we'll make a Person constructor that has a first and last name:
     *
     * var Person = jQuery.Class.extend({
	 *     init: function(first, last) {
	 *         this.first = first;
	 *         this.last  = last;
	 *     }
	 * });
     *
     * var justin = new Person("Justin", "Meyer");
     * justin.first; // "Justin"
     * justin.last; // "Meyer"
     *
     * // Then we'll extend Person into Programmer and add a favorite language:
     *
     * var Programmer = Person.extend({
	 *     init: function(first, last, language) {
	 *         // call base's init
	 *         Person.prototype.init.apply(this, arguments);
	 *
	 *         // other initialization code
	 *         this.language = language;
	 *     },
	 *     bio: function() {
	 *         return "Hi! I'm "" + this.first + " " + this.last +
	 *             " and I write " + this.language + ".";
	 *     }
	 * });
     *
     * var brian = new Programmer("Brian", "Moschel", 'ECMAScript');
     * brian.bio(); // "Hi! I'm Brian Moschel and I write ECMAScript.";
     *
     */
    $.Class.prototype.init = function () {};


    /**
     * Proxy method realization
     *
     * @function proxy
     * @memberOf jQuery.Class
     * @memberOf jQuery.Class.prototype
     *
     * @param {array|string} functions
     * @param {...*} [arguments]
     *
     * @return {function} Proxied function
     */
    $.Class.proxy = $.Class.prototype.proxy = function( funcs ){

        //args that should be curried
        var args = $.makeArray(arguments),
            self;

        // get the functions to callback
        funcs = args.shift();

        // if there is only one function, make funcs into an array
        if (!$.isArray(funcs)) {
            funcs = [funcs];
        }
        // keep a reference to us in self
        self = this;

        //Throw an exception in case methods are not exist in classes
        for (var i = 0; i < funcs.length; i++) {

            if (typeof funcs[i] === "string" && !$.isFunction(this[funcs[i]])) {
                throw ( (this.fullName || this.Class.fullName) + " does not have a " + funcs[i] + "method!");
            }
        }

        return function class_cb() {
            // add the arguments after the curried args
            var cur     = args.concat( $.makeArray(arguments) ),
                length  = funcs.length,
                f       = 0,
                func, isString;

            // go through each function to call back
            for (; f < length; f++) {

                func = funcs[f];

                if (!func) continue;

                // set called with the name of the function on self (this is how this.view works)
                isString = typeof func === 'string';

                // call the function
                cur = (isString ? self[func] : func).apply( self, cur || [] );

                // pass the result to the next function (if there is a next function)
                if (f < length - 1) {
                    cur = !isArray(cur) || cur._use_call ? [cur] : cur;
                }
            }

            return cur;
        };

    };

    return $.Class;

}));
