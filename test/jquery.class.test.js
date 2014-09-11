'use strict';

var Class = require( __dirname + '/../src/jquery.class.js');

var Animal = Class.extend(
    {
        count: 0,
        test: function () {
            return this.match ? true : false;
        }
    },
    {
        init: function () {
            this.constructor.count++;
            this.eyes = false;
        }
    }
);

var Dog = Animal.extend(
    {
        match: /abc/
    },
    {
        init: function () {
            this._super.apply( this, arguments );
        },
        talk: function () {
            return 'Woof';
        }
    }
);

var Ajax = Dog.extend(
    {
        count: 0
    },
    {
        init: function (hairs) {

            this._super.apply( this, arguments );

            this.hairs = hairs;

            this.setEyes();
        },
        setEyes: function () {
            this.eyes = true;
        }
    }
);

describe('Inheritance', function() {

    var Base    = Class({}),
        Inherit = Base.extend({}),
        instance = new Inherit();

    it( 'tree check', function(){

        expect( new Base() instanceof Class ).toBe(true);
        expect( instance instanceof Inherit ).toBe(true);
        expect( instance instanceof Base ).toBe(true);
        expect( instance instanceof Class ).toBe(true);
    });
});

describe('Creating instance', function(){

    new Dog();
    new Animal();
    new Animal();

    var ajax    = new Ajax( 1000 );

    it( 'Static properties using check', function(){

        expect( Animal.count ).toEqual( 2 );
        expect( Dog.count ).toEqual( 1 );
        expect( Ajax.count).toEqual( 1 );
    });

    it( 'Static properties define check', function(){

        expect( Animal.match ).toBeUndefined();
        expect( Dog.match ).toBeDefined();
        expect( Ajax.match ).toBeDefined();
    });

    it( 'Static methods check', function(){

        expect( Dog.test() ).toBe( true );
        expect( Animal.test() ).toBe( false );
    });

    it( 'Prototype properties check', function(){

        expect( ajax.eyes ).toBe( true );
        expect( ajax.hairs ).toEqual( 1000 );
    });

    it( 'Creating without extend check', function () {

        var Bar = Class({
                ok: function () {}
            }),
            Foo = Bar({
                dude: function () {}
            }),
            foo = new Foo,
            bar = new Bar;

        spyOn( foo, 'ok');
        spyOn( foo, 'dude' );

        foo.ok();
        foo.dude(true);

        expect( foo.ok ).toHaveBeenCalled();
        expect( foo.dude).toHaveBeenCalled();
    });

});

describe('Namespaces', function () {

    var fb = Class.extend('Foo.Bar');
    Class.extend('Todo', {}, {});

    it( 'Internal static properties check', function(){

        // does not work at node properly
        expect( global.Foo.Bar === fb ).toBe( true );

        expect( fb.shortName ).toEqual( 'Bar' );
        expect( fb.fullName ).toEqual( 'Foo.Bar' );
    });

});

describe( 'Setups', function(){

    var order = 0,
        staticSetup, staticSetupArgs, staticInit, staticInitArgs, protoSetup, protoInitArgs, protoInit, staticProps = {
                setup: function () {
                    staticSetup = ++order;
                    staticSetupArgs = arguments;
                    return ['something'];
                },
                init: function () {
                    staticInit = ++order;
                    staticInitArgs = arguments;
                }
            }, protoProps = {
                setup: function (name) {
                    protoSetup = ++order;
                    return ['Ford: ' + name];
                },
                init: function () {
                    protoInit = ++order;
                    protoInitArgs = arguments;
                }
            };

    var Car = Class.extend( staticProps, protoProps );

    new Car('geo');

    it( 'Static tests', function(){

        expect( staticSetup ).toEqual( 1 );
        expect( staticInit ).toEqual( 2 );
        expect( Array.prototype.slice.call( staticInitArgs ) ).toEqual( ['something'] );
    });

    it( 'Prototype tests', function(){

        expect( protoSetup ).toEqual( 3 );
        expect( protoInit ).toEqual( 4 );
    });

    it( 'Setup should be called with original arguments', function(){

        var o1 = {
                setup: function(base, arg1, arg2){

                    expect( o1 ).toEqual( arg1 );
                    expect( o2 ).toEqual( arg2 );
                }
            },
            o2 = {};

        Class.extend(o1,o2);
    });
});

describe( 'Proxy method', function(){

    it( 'Static proxy test', function(){

        var curVal  = 0,
            Foo     = Class.extend(
                {
                    show: function (value) {

                        expect( curVal ).toEqual( value );
                        expect( this ).toEqual( Foo );
                    }
                },
                {}
            ),
            proxy1  = Foo.proxy('show'),
            proxy2;

        curVal = 1;
        proxy1(1);

        curVal = 2;

        proxy2 = Foo.proxy('show', 2);
        proxy2();

    });

    it( 'Should throw exception if method is not defined', function(){

        var Foo = Class.extend({
                testThrow: function(){

                    this.proxy('notExist');
                },
                test: function(){

                    this.proxy('bar')
                },
                bar: function(){

                }
            }),
            foo = new Foo;

        expect( foo.testThrow.bind( foo ) ).toThrow();
        expect( foo.test.bind( foo ) ).not.toThrow();
    });

});

describe( 'Super method ( call parent methods )', function(){

    it('Prototype super', function(){

        var A = Class.extend({
                init: function (arg) {
                    this.arg = arg + 1;
                },
                add: function (num) {
                    return this.arg + num;
                }
            }),
            B = A.extend({
                init: function (arg) {
                    this._super(arg + 2);
                },
                add: function (arg) {
                    return this._super(arg + 1);
                }
            }),
            b = new B(1);

        expect( b.arg ).toEqual( 4 );
        expect( b.add(2) ).toEqual( 7 );
    });

    it('Static super', function(){

        var First = Class.extend({
                raise: function (num) {
                    return num;
                }
            }, {}),
            Second = First.extend({
                raise: function (num) {
                    return this._super(num) * num;
                }
            }, {});

        expect( Second.raise(2) ).toEqual( 4 );
    });

    //@TODO check this out
//    it('When parent method does not exist', function(){
//
//        var Foo = Class.extend({}),
//            Bar = Foo.extend({
//
//                test: function(){
//
//                    this._super();
//                }
//            }),
//            bar = new Bar;
//
//        expect( bar.test.bind( bar ) ).not.toThrow();
//    });
});

