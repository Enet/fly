/*!
 * Fly.js - JavaScript Library
 * (c) 2013-2014 Stepan Zhevak <enet@flyjs.ru>
 * MIT Licensed.
 *
 * http://flyjs.ru
 * http://github.com/Enet/fly
 */
(function(window, document, undefined) {

    var FlyCore = {
        const: {
            protobject: Object.prototype,
            span: document.createElement('span'),
            map: {
                escape: {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;'
                },
                property: {
                    one: ['scrollTop', 'scrollLeft', 'fontSize', 'opacity', 'letterSpacing', 'wordSpacing', 'outlineOffset', 'lineHeight', 'backgroundPositionX', 'backgroundPositionY'],
                    two: ['backgroundPosition', 'backgroundSize'],
                    multi: ['margin', 'padding', 'borderRadius', 'borderWidth']
                },
                color: {
                    white: {r: 255, g: 255, b: 255},
                    silver: {r: 192, g: 192, b: 192},
                    gray: {r: 128, g: 128, b: 128},
                    black: {r: 0, g: 0, b: 0},
                    maroon: {r: 128, g: 0, b: 0},
                    red: {r: 255, g: 0, b: 0},
                    orange: {r: 255, g: 165, b: 0},
                    yellow: {r: 255, g: 255, b: 0},
                    olive: {r: 128, g: 128, b: 0},
                    lime: {r: 0, g: 255, b: 0},
                    green: {r: 0, g: 128, b: 0},
                    aqua: {r: 0, g: 255, b: 255},
                    blue: {r: 0, g: 0, b: 255},
                    navy: {r: 0, g: 0, b: 128},
                    teal: {r: 0, g: 128, b: 128},
                    fuchsia: {r: 255, g: 0, b: 255},
                    purple: {r: 128, g: 0, b: 128}
                }
            },
            regex: {
                color: [
                    /^\s*(#)([a-f0-9])([a-f0-9])([a-f0-9])([a-f0-9])?$/i,
                    /^\s*(#)([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?$/i,
                    /^\s*(rgb|hsl|hsv)\s*\(\s*(\d{0,3})\s*,\s*(\d{0,3})\s*,\s*(\d{0,3})\s*\)$/i,
                    /^\s*(rgba|hsla|hsva)\s*\(\s*(\d{0,3})\s*,\s*(\d{0,3})\s*,\s*(\d{0,3})\s*,\s*([\d\.]*)\s*\)$/i,
                ]
            },
            browser: undefined,
            ppi: undefined,
            ready: false,
            maxTransitionTime: 1.25
        },
        constructor: {},
        preset: {
            empty: {
                ajax: {
                    progress: null,
                    before: null,
                    complete: null,
                    error: null,
                    success: null,
                    status: null
                },
                animate: {},
                stylize: {}
            },
            default: {
                ajax: {
                    url: '',
                    method: 'GET',
                    async: true,
                    timeout: 10000,
                    global: true,
                    data: {},
                    parser: 'text',
                    cache: false,
                    encoding: 'application/x-www-form-urlencoded',
                    headers: {},
                    xhr: function() {
                        return new (XMLHttpRequest || XDomainRequest)();
                    }
                },
                animate: {

                },
                stylize: {},
            },
            user: {
                ajax: {},
                animate: {},
                stylize: {}
            }
        },
        cache: {
            display: {},
            handler: {},
            listener: {}
        },
        data: {
            ready: [],
            dom: {},
            hook: {
                event: {},
                css: {
                    boxShadow: {
                        parser: function(value, property, data4convert) {
                            result = '[';
                            value = value.trim();

                            if (value !== 'none') {
                                value = value.replace(/\(.*?\)/g, function(temp) {
                                    return temp.replace(/,/g, ';').replace(/\s+/g, '');
                                }).split(',');

                                var colorParser = coreData.hook.css.color.parser,
                                    sizeParser = fnStyle.oneSizeParser;

                                for (var v = 0, vl = value.length; v < vl; v++) {
                                    var string = value[v],
                                        shadow = {};

                                    if (string.indexOf('current') === -1) {
                                        shadow.i = string.indexOf('inset') !== -1;
                                        string = string.replace('inset', '').replace(/;/g, ',').replace(/\s{2,}/g, ' ').trim();
                                        var matches = string.split(' '),
                                            color = colorParser(matches[0]),
                                            m = 0,
                                            c = matches.length - 1;

                                        if (color.status) {
                                            m = 1;
                                        } else {
                                            color = colorParser(matches[c]);
                                            if (color.status) c--;
                                        }

                                        if (data4convert) data4convert.unit = 'px';
                                        var x = sizeParser(matches[m] || '', property, data4convert),
                                            y = sizeParser(matches[m + 1] || '', property, data4convert),
                                            blur = sizeParser(c > 1 ? matches[m + 2] : '', property, data4convert),
                                            spread = sizeParser(c > 2 ? matches[m + 3] : '', property, data4convert);

                                        shadow.x = x.value * x.status;
                                        shadow.y = y.value * y.status;
                                        shadow.b = blur.value * blur.status;
                                        shadow.s = spread.value * spread.status;
                                        shadow.c = color.value;
                                    }

                                    result += JSON.stringify(shadow) + ',';
                                }
                            }
                            return {value: result + '0]', unit: '', status: true};
                        },
                        calc: function(action, one, two) {
                            switch(action) {
                                case '-=': return one.replace(two.substring(1, two.length - 2), '{"x":0,"y":0,"b":0,"s":0,"c":"0,0,0,0","i":false},');
                                case '+=': return one.substr(0, one.length - 2) + two.substr(1);
                                default: return two;
                            }
                        }
                    },
                    textShadow: {},
                    color: {
                        parser: function(value, property, data4convert) {
                            var re = coreConst.regex.color;

                            value = value.trim();
                            for (var r = 0, rl = re.length; r < rl; r++) {
                                var matches = value.match(re[r]);
                                if (matches) break;
                            }

                            matches = matches || {};

                            var r, g, b, a;
                            if (matches[1] in coreConst.map.color) {
                                var v = coreConst.map.color[matches[1]];
                                r = v.r; g = v.g; b = v.b; a = 1;
                            } else {
                                switch(matches[1]) {
                                    case 'transparent':
                                        r = 0; g = 0; b = 0; a = 0;
                                        break;
                                    case '#':
                                        var full = matches[2].length === 1 ? function(s) {
                                                return s + s;
                                            } : function(s) {
                                                return s;
                                            };
                                            r = parseInt(full(matches[2]), 16);
                                            g = parseInt(full(matches[3]), 16);
                                            b = parseInt(full(matches[4]), 16);
                                            a = parseInt(matches[5] ? full(matches[5]) : 'ff', 16) / 255;
                                        break;
                                    case 'rgb':
                                    case 'rgba':
                                    case 'hsl':
                                    case 'hsla':
                                    case 'hsv':
                                    case 'hsva':
                                        var scheme = matches[1].substr(0, 3),
                                            converter = fnConverter[scheme + 'ToRgb'] || function(r, g, b) {return [r, g, b]},
                                            v = converter(+matches[2], +matches[3], +matches[4]);
                                        r = v[0];
                                        g = v[1];
                                        b = v[2];
                                        a = matches[5] === undefined ? 1 : +matches[5];
                                        break;
                                    default:
                                        return {value: '0,0,0,0', unit: '', status: false};
                                }
                            }

                            return {
                                value: r + ',' + g + ',' + b + ',' + a,
                                unit: '',
                                status: true
                            };
                        },
                        calc: function(action, one, two) {
                            var sign,
                                act = function(n) {
                                    var max = n === 3 ? 1 : 255;
                                    return Math.max(0, Math.min(max, +one[n] + sign * two[n]));
                                };
                            switch(action) {
                                case '+=': sign = 1; break;
                                case '-=': sign = -1; break;
                                default: return two;
                            }
                            one = one.split(',');
                            two = two.split(',');
                            return [act(0), act(1), act(2), act(3)].join(',');
                        },
                        step: function(from, to, unit, delta) {
                            from = from.split(',');
                            to = to.split(',');
                            if (+from[3] === 0) {
                                from = to.slice();
                                from[3] = 0;
                            };
                            var act = function(n) {
                                var max = n === 3 ? 1 : 255,
                                    round = function(i) {
                                        return n === 3 ? i : Math.round(i);
                                    };
                                return Math.max(0, Math.min(max, round(+from[n] + (1 * to[n] - 1 * from[n]) * delta)));
                            };
                            return 'rgba(' + [act(0), act(1), act(2), act(3)].join(',') + ')';
                        }
                    }
                }
            },
            easing: {
                js: {
                    linear: function(p) {return p},
                    easeIn: function(p) {return Math.pow(p, 1.5)},
                    easeOut: function(p) {return 1 - Math.pow(1 - p, 1.5)},
                    easeInOut: function(p) {return p <= 0.5 ? Math.pow(p * 2, 1.5) / 2 : 1 - Math.pow(2 - p * 2, 1.5) / 2},
                    easeInQuad: function(p) {return Math.pow(p, 2)},
                    easeOutQuad: function(p) {return 1 - Math.pow(1 - p, 2)},
                    easeInOutQuad: function(p) {return p <= 0.5 ? Math.pow(p * 2, 2) / 2 : 1 - Math.pow(2 - p * 2, 2) / 2},
                    easeInCubic: function(p) {return Math.pow(p, 3)},
                    easeOutCubic: function(p) {return 1 - Math.pow(1 - p, 3)},
                    easeInOutCubic: function(p) {return p <= 0.5 ? Math.pow(p * 2, 3) / 2 : 1 - Math.pow(2 - p * 2, 3) / 2},
                    easeInQuart: function(p) {return Math.pow(p, 4)},
                    easeOutQuart: function(p) {return 1 - Math.pow(1 - p, 4)},
                    easeInOutQuart: function(p) {return p <= 0.5 ? Math.pow(p * 2, 4) / 2 : 1 - Math.pow(2 - p * 2, 4) / 2},
                    easeInQuint: function(p) {return Math.pow(p, 5)},
                    easeOutQuint: function(p) {return 1 - Math.pow(1 - p, 5)},
                    easeInOutQuint: function(p) {return p <= 0.5 ? Math.pow(p * 2, 5) / 2 : 1 - Math.pow(2 - p * 2, 5) / 2},
                    easeInExpo: function(p) {return Math.pow(2, (p - 1) * 8) - 0.00390625 * (1 - p)},
                    easeOutExpo: function(p) {return 1 - Math.pow(2, -p * 8) + 0.00390625 * p},
                    easeInOutExpo: function(p) {return p <= 0.5 ? (Math.pow(2, (p * 2 - 1) * 8) - 0.00390625 * (1 - p * 2)) / 2 : (2 - Math.pow(2, 8 - 16 * p) + 0.00390625 * 2 * p) / 2},
                    easeInSine: function(p) {return 1 - Math.sin((1 - p) * Math.PI / 2)},
                    easeOutSine: function(p) {return Math.sin(p * Math.PI / 2)},
                    easeInOutSine: function(p) {return p <= 0.5 ? (1 - Math.sin((1 - p * 2) * Math.PI / 2)) / 2 : (1 + Math.sin((-1 + 2 * p) * Math.PI / 2)) / 2},
                    easeInCirc: function(p) {return 1 - Math.sin(Math.acos(p))},
                    easeOutCirc: function(p) {return Math.sin(Math.acos(1 - p))},
                    easeInOutCirc: function(p) {return p <= 0.5 ? (1 - Math.sin(Math.acos(p * 2))) / 2 : 0.5 + Math.sin(Math.acos(2 - 2 * p)) / 2},
                    easeInBack: function(p) {return Math.pow(1.5 * p - 5 / 12, 2) - 25 / 144},
                    easeOutBack: function(p) {return -Math.pow(1.5 * p - 13 / 12, 2) + 169 / 144},
                    easeInOutBack: function(p) {return p <= 0.5 ? (Math.pow(3 * p - 5 / 12, 2) - 25 / 144) / 2 : 1 - Math.pow(3 - 3 * p - 5 / 12, 2) / 2 + 25 / 288}
                },
                css: {
                    linear: [0,0,0,0],
                    easeIn: [.42,0,1,1],
                    easeOut: [0,0,.58,1],
                    easeInOut: [.42,0,.58,1],
                    easeInQuad: [.55,.085,.68,.53],
                    easeOutQuad: [.25,.46,.45,.94],
                    easeInOutQuad: [.455,.03,.515,.955],
                    easeInCubic: [.55,.055,.675,.19],
                    easeOutCubic: [.215,.61,.355,1],
                    easeInOutCubic: [.654,.045,.355,1],
                    easeInQuart: [.895,.03,.685,.22],
                    easeOutQuart: [.165,.84,.44,1],
                    easeInOutQuart: [.77,0,.175,1],
                    easeInQuint: [.755,.05,.855,.06],
                    easeOutQuint: [.23,1,.32,1],
                    easeInOutQuint: [.86,0,.07,1],
                    easeInExpo: [.95,.05,.795,.035],
                    easeOutExpo: [.19,1,.22,1],
                    easeInOutExpo: [1,0,0,1],
                    easeInSine: [.47,0,.745,.715],
                    easeOutSine: [.39,.575,.565,1],
                    easeInOutSine: [.445,.05,.55,.95],
                    easeInCirc: [.6,.04,.98,.335],
                    easeOutCirc: [.075,.82,.165,1],
                    easeInOutCirc: [.785,.135,.15,.86],
                    easeInBack: [.6,-.28,.735,.045],
                    easeOutBack: [.175,.885,.32,1.275],
                    easeInOutBack: [.68,-.55,.265,1.55]
                }
            }
        },
        global: {
            detectPpi: function() {
                var div = document.createElement('div'),
                head = document.head;
                div.style.width = '1in';
                head.appendChild(div);
                coreConst.ppi = parseFloat(document.defaultView.getComputedStyle(div).getPropertyValue('width'));
                head.removeChild(div);
            },

            detectBrowser: function() {
                var ua = navigator.userAgent.toLowerCase(),
                    result = {
                        webkit: false,
                        gecko: false,
                        trident: false,
                        prefix: '',
                        version: 0
                    },
                    p;
                if ((p = ua.indexOf('chrome/')) !== -1) {
                    p += 7;
                    result.webkit = true;
                    result.version = ua.substring(p, ua.indexOf(' ', p));
                    result.prefix = 'webkit';
                } else if ((p = ua.indexOf('firefox/')) !== -1) {
                    p += 8;
                    result.gecko = true;
                    result.version = ua.substring(p, ua.indexOf(' ', p));
                    result.prefix = 'moz';
                    coreGlobal.fixMouseWheel();
                } else if ((p = ua.indexOf('trident/')) !== -1) {
                    p = ua.indexOf('msie ') + 5;
                    result.trident = true;
                    result.version = p === 4 ? '11+' : ua.substring(p, ua.indexOf(' ', p) - 1);
                    result.prefix = 'ms';
                }
                coreConst.browser = result;
            },

            fixMouseWheel: function() {
                coreData.hook.event.mousewheel = {
                    wrap: function(callback) {
                        var that = this;
                        return function(event) {
                            event.wheelDelta = event.deltaY * 40;
                            callback.apply(that, arguments);
                        }
                    },
                    name: 'wheel'
                };
            },

            setRequestAnimationFrame: function() {
                window.requestAnimationFrame = window.requestAnimationFrame || function(callback) {
                    setTimeout(callback, 15);
                };
            },

            generateMethods: function() {
                var sizeParser = {
                        'two': {
                            size: 2,
                            caseHandler: function(string) {
                                switch(string.length) {
                                    case 1: return [string[0], string[0]];
                                    case 2: return string;
                                    default: return false;
                                }
                            }
                        },
                        'multi': {
                            size: 4,
                            caseHandler: function(string) {
                                switch(string.length) {
                                    case 1: return [string[0], string[0], string[0], string[0]];
                                    case 2: return [string[0], string[1], string[0], string[1]];
                                    case 3: return [string[0], string[1], string[2], string[1]];
                                    case 4: return string;
                                    default: return false;
                                }
                            }
                        }
                    };

                for (var p in sizeParser) {
                    var sp = sizeParser[p];
                    (function(p, size, caseHandler) {
                        fnStyle[p + 'SizeParser'] = function(string, property, data4convert) {
                            string = string.trim().replace(/,/g, ' ').replace(/\s{2,}/g, ' ').split(' ');

                            var data = caseHandler(string);
                            if (data) {
                                var n4convert = [],
                                    status = true,
                                    value = [],
                                    unit = [];

                                if (data4convert) {
                                    var u = data4convert.unit.split('&');
                                    for (var n = 0; n < size; n++) {
                                        n4convert.push($.extend({}, data4convert, {unit: u[n]}));
                                    }
                                }

                                for (var n = 0; n < size; n++) {
                                    var item = fnStyle.oneSizeParser(data[n], property, n4convert[n]);
                                    value.push(item.value);
                                    unit.push(item.unit);
                                    status = status && item.status;
                                }

                                return {
                                    value: value.join('&'),
                                    unit: unit.join('&'),
                                    status: status
                                };
                            } else {
                                return {value: null, unit: null, status: false};
                            }
                        };

                        fnStyle[p + 'SizeCalc'] = function(action, one, two) {
                            one = one.split('&');
                            two = two.split('&');
                            var result = [];
                            for (var n = 0; n < size; n++) {
                                result.push(fnStyle.oneSizeCalc(action, one[n], two[n]));
                            }
                            return result.join('&');
                        };

                        fnStyle[p + 'SizeStep'] = function(from, to, unit, delta) {
                            from = from.split('&');
                            to = to.split('&');
                            unit = unit.split('&');
                            var result = [];
                            for (var n = 0; n < size; n++) {
                                result.push(fnStyle.oneSizeStep(from[n], to[n], unit[n], delta));
                            }
                            return result.join(' ');
                        };
                    })(p, sp.size, sp.caseHandler);
                }
            },

            generateHooks: function() {
                var hooks = {
                        oneValue: {
                            x: 'translateX',
                            y: 'translateX',
                            translateX: 'translateX',
                            translateY: 'translateY',
                            skewX: 'skewX',
                            skewY: 'skewY',
                            rotateX: 'rotateX',
                            rotateY: 'rotateY',
                            scaleX: 'scaleX',
                            scaleY: 'scaleY',
                            rotate: 'rotate',
                            perspective: 'perspective'
                        },
                        twoValue: {
                            translate: 'translate',
                            scale: 'scale',
                            rotate3d: 'rotate3d',
                            skew: 'skew'
                        }
                    };
                for (var t in hooks) {
                    var type = hooks[t];
                    for (var h in type) {
                        (function(h, hook, type) {
                            coreConst.map.property[type.substr(0, 3)].push(h);
                            coreData.hook.css[h] = {
                                transition: 'transform',
                                prefix: 2,
                                get: function(element, style) {
                                    var property = fnConverter.stringToHyphenCase(fnCommon.testPrefix('transform', 2)),
                                        inline = (element.getAttribute('style') || '').match(new RegExp('(?:^|\\s|;)' + property + ':\\s*(.*?)(?:$|;)')),
                                        matches = (inline ? inline[1] : '').match(new RegExp(hook + '\\((.*?)\\)')),
                                        empty = h.substr(0, 5) === 'scale' ? '1' : '0';
                                    return matches ? matches[1].replace(/\s+/g, '') : (type === 'oneValue' ? empty : empty + ',' + empty);
                                },
                                set: function(element, style, value) {
                                    var property = fnConverter.stringToHyphenCase(fnCommon.testPrefix('transform', 2)),
                                        inline = (element.getAttribute('style') || '').match(new RegExp('(?:^|\\s|;)' + property + ':\\s*(.*?)(?:$|;)')),
                                        matches = (inline ? inline[1] : '');
                                    if (matches.indexOf(hook + '(') === -1) {
                                        value = matches + ' ' + hook + '(' + value + ')';
                                    } else {
                                        value = matches.replace(new RegExp('(.*' + hook + '\\().*?(\\).*)'), '$1' + value + '$2');
                                    }
                                    style[property] = value;
                                },
                                step: type === 'oneValue' ? fnStyle.oneSizeStep : function() {
                                    var result = fnStyle.twoSizeStep.apply(this, arguments);
                                    return result.split(' ').join(',');
                                }
                            };
                        })(h, type[h], t);
                    }
                }

                hooks = {Left: 0, Top: 0};
                var testRootElement = function(element) {
                    if (!fnNodeList.isNormal(element) || element === document.body) {
                        return document[$.browser().webkit ? 'body' : 'documentElement'];
                    } else {
                        return element;
                    }
                };
                for (var h in hooks) {
                    (function(h) {
                        coreData.hook.css[h] = {
                            transition: false,
                            get: function(element, style) {
                                element = testRootElement(element);
                                return element[h];
                            },
                            set: function(element, style, value) {
                                element = testRootElement(element);
                                element[h] = parseInt(value);
                            }
                        };
                    })('scroll' + h);
                }

                hooks = {
                    borderColor: 0,
                    borderLeftColor: 0,
                    borderRightColor: 0,
                    borderTopColor: 0,
                    borderBottomColor: 0,
                    backgroundColor: 0,
                    outlineColor: 0,
                    textDecorationColor: 0,
                    columnRuleColor: 0,
                    textEmphasisColor: 0
                };
                var hook = coreData.hook.css.color;
                for (var h in hooks) {
                    (function(h) {
                        coreData.hook.css[h] = hook;
                    })(h);
                }

                hooks = {box: coreData.hook.css.boxShadow, text: coreData.hook.css.textShadow};
                var shadowStep = function(isBox, from, to, unit, delta) {
                        from = JSON.parse(from);
                        to = JSON.parse(to);

                        var count = Math.max(from.length, to.length) - 1,
                            result = '',
                            ds = {x: 0, y: 0, b: 0, c: '0,0,0,0'},
                            list = {x: 0, y: 0, b: 0};

                        if (isBox) {
                            ds.i = false;
                            ds.s = 0;
                            list.s = 0;
                        }

                        for (var c = 0; c < count; c++) {
                            var fs = from[c] || ds,
                                ts = to[c] || ds,
                                shadow = '';
                            for (var p in list) {
                                if (isNaN(ts[p]) || ts[p] === undefined) ts[p] = fs[p];
                                shadow += (fs[p] + (ts[p] - fs[p]) * delta) + 'px ';
                            }
                            if (!ts.c) ts.c = fs.c;
                            shadow += coreData.hook.css.color.step(fs.c, ts.c, '', delta);
                            if (isBox) shadow += ts.i ? ' inset' : '';

                            result += shadow + (c === count - 1 ? '' : ',');
                        }
                        return result;
                    };
                for (var h in hooks) {
                    (function(h) {
                        coreData.hook.css[h + 'Shadow'].step = function(from, to, unit, delta) {
                            return shadowStep.call(this, h === 'box', from, to, unit, delta);
                        };
                    })(h);
                }
                hooks.text.parser = hooks.box.parser;
                hooks.text.calc = hooks.box.calc;

                hooks = {mouseenter: 'mouseover', mouseleave: 'mouseout'};
                for (var h in hooks) {
                    (function(h, hook) {
                        coreData.hook.event[h] = {
                            wrap: function(callback) {
                                return function(event) {
                                    var target = event.flyTarget,
                                        related = event.relatedTarget;

                                    if (!related || (related !== target && !target.contains(related))) {
                                        event.type = hook;
                                        callback.apply(this, arguments);
                                    }
                                }
                            },
                            name: hook
                        };
                    })(h, hooks[h]);
                }
            },

            generateConstructors: function() {
                for (var c in scope.constructor) {
                    var object = coreConstructor[c] = scope.constructor[c];

                    switch(c) {
                        case 'Fly':
                            var types = ['Number', 'Object', 'Function', 'Undefined', 'Null', 'Array', 'Boolean', 'String'];
                            for (var t = 0, tl = types.length; t < tl; t++) {
                                var type = types[t];
                                (function(type) {
                                    object['is' + type] = function(value) {
                                        return coreConst.protobject.toString.call(value) === '[object ' + type + ']';
                                    };
                                })(type);
                            }

                            var group = {
                                    countBy: function(result, key) {
                                        result.hasOwnProperty(key) ? result[key]++ : (result[key] = 1);
                                    },
                                    groupBy: function(result, key, value) {
                                        (result.hasOwnProperty(key) ? result[key] : (result[key] = [])).push(value);
                                    },
                                    indexBy: function(result, key, value) {
                                        result[key] = value;
                                    }
                                };
                            for (var g in group) {
                                (function(g) {
                                    object[g] = function(object, value, context) {
                                        var result = {},
                                            iterator;
                                        if (value === null) {
                                            iterator = function(value) {return value;};
                                        } else {
                                            iterator = $.isFunction(value) ? value : function(o) {
                                                return o[value];
                                            };
                                        }

                                        $.each(object, function(value, index) {
                                            var key = iterator.call(context, value, index, object);
                                            group[g](result, key, value);
                                        });
                                        return result;
                                    };
                                })(g);
                            }

                            for (var e in {escape: 0, unescape: 0}) {
                                (function(e) {
                                    object[e] = function(string) {
                                        return fnCommon.applyMap(e, string);
                                    };
                                })(e);
                            }

                            for (var s in {set: 0, unset: 0}) {
                                (function(s) {
                                    object[s] = function(method, name, options) {
                                        return fnCommon.changePreset(s, method, name, options);
                                    };
                                })(s);
                            }

                            for (var m in {min: 0, max: 0}) {
                                (function(m) {
                                    object[m] = function(list, iterator) {
                                        return fnCommon.extremum(m, list, iterator);
                                    }
                                })(m);
                            }

                            break;
                        case 'FlyDomNode':
                            for (var x in {map: 0, grep: 0}) {
                                (function(x) {
                                    object[x] = function(callback, context) {
                                        var results = $[x](this, callback, context),
                                            list = [],
                                            add = function(node) {
                                                if (list.indexOf(node) === -1) list.push(node);
                                            };

                                        for (var r = 0, rl = results.length; r < rl; r++) {
                                            var result = results[r];
                                            if (result.length) {
                                                for (var n = 0, nl = result.length; n < nl; n++) {
                                                    add(result[n]);
                                                }
                                            } else {
                                                add(result);
                                            }
                                        }
                                        return new this.__self(list);
                                    };
                                })(x);
                            }

                            var so = {prev: 'previous', next: 'next'};
                            for (var s in so) {
                                (function(s, ss) {
                                    object[s] = function(selector) {
                                        return fnNodeList.transformNodeContext(this, function(element, context) {
                                            var sibling = element[ss];
                                            if (sibling !== null && fnStyle.isMatch(sibling, selector)) context.push(sibling);
                                        });
                                    };

                                    object[s + 'All'] = function(selector) {
                                        return fnNodeList.transformNodeContext(this, function(element, context) {
                                            var sibling = element;
                                            while ((sibling = sibling[ss]) !== null) {
                                                if (context.indexOf(sibling) === -1 && fnStyle.isMatch(sibling, selector)) context.push(sibling);
                                            }
                                        });
                                    };
                                })(s, so[s] + 'ElementSibling');
                            }

                            var fo = {not: function(v) {return !v;}, filter: function(v) {return v;}};
                            for (var f in fo) {
                                (function(f, fo) {
                                    object[f] = function(selector) {
                                        return fnNodeList.transformNodeContext(this, function(element, context) {
                                            if (fo[f](fnStyle.isMatch(element, selector))) context.push(element);
                                        });
                                    };
                                })(f, fo);
                            }

                            for (var a in {add: 0, remove: 0, toggle: 0}) {
                                (function(a) {
                                    object[a + 'Class'] = function() {
                                        return fnClassList.changeClassList(this, a, arguments);
                                    };
                                })(a);
                            }

                            for(var v in {show: 0, hide: 0}) {
                                (function(v) {
                                    object[v] = function(selector) {
                                        return this.each(function(element) {
                                            if (fnStyle.isMatch(element, selector)) fnDom[v](element);
                                        });
                                    };
                                })(v);
                            }

                            var properties = {
                                css: {
                                    getter: function(th, property) {
                                        return fnStyle.getStyle(th[0], property);
                                    },
                                    setter: function(element, object, o) {
                                        var p = fnConverter.stringToCamelCase(o),
                                            string = object[o] + '',
                                            matches = fnStyle.actionParser(string),
                                            parser = fnStyle.getTool('parser', p),
                                            to = parser(matches.value, p),
                                            from = parser(fnStyle.getStyle(element, p), p, {element: element, unit: to.unit});

                                        to.value = fnStyle.getTool('calc', p)(matches.action, from.value, to.value);

                                        fnStyle.setStyle(element, p, fnStyle.getTool('step', p)(from.value, to.value, to.unit, 1));
                                    }
                                },
                                attr: {
                                    getter: function(th, attr) {
                                        return th[0].getAttribute(attr);
                                    },
                                    setter: function(element, object, o) {
                                        element.setAttribute(o, object[o]);
                                    }
                                }
                            };
                            for (var p in properties) {
                                var property = properties[p];
                                (function(p, getter, setter) {
                                    object[p] = function(property, value) {
                                        if ($.isString(property)) {
                                            if (value === undefined) {
                                                return this.length > 0 ? getter(this, property) : undefined;
                                            } else {
                                                var object = {};
                                                object[property] = value;
                                            }
                                        } else {
                                            object = property;
                                        }
                                        if ($.isObject(object)) {
                                            this.each(function(element) {
                                                for (var o in object) {
                                                    if (object.hasOwnProperty(o)) setter(element, object, o);
                                                }
                                            });
                                        }
                                        return this;
                                    };
                                })(p, property.getter, property.setter);
                            }

                            var scroll = {X: ['Left', 'Width'], Y: ['Top', 'Height']};
                            for (var s in scroll) {
                                var ss = scroll[s];
                                (function(s, ss) {
                                    object['scroll' + s] = function(value) {
                                        if (value === undefined) {
                                            if (this.length) {
                                                var element = this[0];
                                                if (fnNodeList.isNormal(element)) {
                                                    return fnStyle.getScrollDismensions(element, ss[0], ss[1]);
                                                } else {
                                                    var result = {};
                                                    result[ss[0].toLowerCase()] = window['page' + s + 'Offset'];
                                                    result[ss[1].toLowerCase()] = document[ss[1].toLowerCase()];
                                                    return result;
                                                }
                                            } else {
                                                return null;
                                            }
                                        } else {
                                            return this.each(function(element) {
                                                if (fnNodeList.isNormal(element)) {
                                                    element['scroll' + ss[0]] = parseInt(value) || 0;
                                                } else {
                                                    window.scrollTo(s === 'X' ? value : window.pageXOffset, s === 'Y' ? value : window.pageYOffset);
                                                }
                                            });
                                        }
                                    };
                                })(s, ss);
                            }

                            var size = {height: ['Top', 'Bottom'], width: ['Left', 'Right']};
                            for (var s in size) {
                                var ss = size[s],
                                    su = s[0].toUpperCase() + s.substr(1);
                                (function(s, ss, su) {
                                    object[s] = function(value) {
                                        if (value === undefined) {
                                            var element = this[0];
                                            if (fnNodeList.isNormal(element)) {
                                                return fnStyle.getSizeDismensions(element, {
                                                    border: [s, '-padding' + ss[0], '-padding' + ss[1], '-border' + ss[0] + 'Width', '-border' + ss[1] + 'Width'],
                                                    padding: [s, '-padding' + ss[0], '-padding' + ss[1]],
                                                    content: [s]
                                                });
                                            } else if (element === window) {
                                                return window['inner' + su];
                                            } else {
                                                return document[s];
                                            }
                                        } else {
                                            this.each(function(element) {
                                                if (fnNodeList.isNormal(element)) {
                                                    if (!isNaN(+value)) value += 'px';
                                                    element.style[s] = value;
                                                }
                                            });
                                            return this;
                                        }
                                    };

                                    object['inner' + su] = function() {
                                        var element = this[0];
                                        if (fnNodeList.isNormal(element)) {
                                            return fnStyle.getSizeDismensions(element, {
                                                border: [s, '-border' + ss[0] + 'Width', '-border' + ss[1] + 'Width'],
                                                padding: [s],
                                                content: [s, 'padding' + ss[0], 'padding' + ss[1]]
                                            });
                                        } else if (element === window) {
                                            return window['inner' + su];
                                        } else {
                                            return document[s];
                                        }
                                    };

                                    object['outer' + su] = function() {
                                        var element = this[0];
                                        if (fnNodeList.isNormal(element)) {
                                            return fnStyle.getSizeDismensions(element, {
                                                border: [s],
                                                padding: [s, 'border' + ss[0] + 'Width', 'border' + ss[1] + 'Width'],
                                                content: [s, 'border' + ss[0] + 'Width', 'border' + ss[1] + 'Width', 'padding' + ss[0], 'padding' + ss[1]]
                                            });
                                        } else if (element === window) {
                                            return window['outer' + su];
                                        } else {
                                            return document[s];
                                        }
                                    };
                                })(s, ss, su);
                            }

                            var dom = {
                                    after: function(element, fragment) {
                                        var next = element.nextSibling;
                                        if (next) {
                                            element.parentNode.insertBefore(fragment, next);
                                        } else {
                                            element.parentNode.appendChild(fragment);
                                        }
                                    },
                                    before: function(element, fragment) {
                                        element.parentNode.insertBefore(fragment, element);
                                    },
                                    append: function(element, fragment) {
                                        element.appendChild(fragment);
                                    },
                                    prepend: function(element, fragment) {
                                        element.insertBefore(fragment, element.firstChild);
                                    },
                                    wrap: function(element, fragment) {
                                        var wrapper = fragment.childNodes[0];
                                        element.parentNode.insertBefore(fragment, element);
                                        wrapper.appendChild(element);
                                    }
                                };
                            for (var d in dom) {
                                (function(d, callback) {
                                    object[d] = function(zero) {
                                        var has0 = $.isBoolean(zero);
                                        fnNodeList.insertDomFragment(false, has0 ? zero : false, has0 ? [].slice.call(arguments, 1) : arguments, this, callback);
                                        return this;
                                    };
                                })(d, dom[d]);
                            }

                            var dom = {
                                    appendTo: function(element, fragment) {
                                        element.appendChild(fragment);
                                    },
                                    prependTo: function(element, fragment) {
                                        element.insertBefore(fragment, element.firstChild);
                                    },
                                    insertAfter: function(element, fragment) {
                                        var next = element.nextSibling;
                                        if (next) {
                                            element.parentNode.insertBefore(fragment, next);
                                        } else {
                                            element.parentNode.appendChild(fragment);
                                        }
                                    },
                                    insertBefore: function(element, fragment) {
                                        element.parentNode.insertBefore(fragment, element);
                                    }
                                };
                            for (var d in dom) {
                                (function(d, callback) {
                                    object[d] = function(zero) {
                                        var has0 = $.isBoolean(zero);
                                        return fnNodeList.insertDomFragment(true, has0 ? zero : false, this, has0 ? [].slice.call(arguments, 1) : arguments, callback);
                                    };
                                })(d, dom[d]);
                            }

                            var wrap = {
                                    Inner: {
                                        finder: 'get',
                                        loop: function(context, children) {
                                            return {min: 0, max: children.length - 1};
                                        }
                                    },
                                    All: {
                                        finder: 'closest',
                                        loop: function(context, children) {
                                            var result = {min: 0, max: 0},
                                                cl = children.length - 1,
                                                parent = children[0].parentNode;

                                            context.addClass('__FlyJSWrapAllClass');
                                            var nodeList = parent.querySelectorAll('.__FlyJSWrapAllClass'),
                                                info = {
                                                    minNode: nodeList[0], maxNode: nodeList[nodeList.length - 1],
                                                    minSign: 1, maxSign: -1,
                                                    minStart: 0, maxStart: cl,
                                                    minEnd: cl, maxEnd: 0
                                                };
                                            context.removeClass('__FlyJSWrapAllClass');
                                            for (var r in result) {
                                                var n = info[r + 'Node'],
                                                    s = info[r + 'Sign'];

                                                for (var c = info[r + 'Start']; c * s <= s * info[r + 'End']; c += s) {
                                                    var child = children[c];
                                                    if (child === n || child.contains(n)) {
                                                        result[r] = c;
                                                        break;
                                                    }
                                                }
                                            }

                                            return result;
                                        }
                                    }
                                };
                            for (var w in wrap) {
                                (function(w, info) {
                                    object['wrap' + w] = function(zero) {
                                        var has0 = $.isBoolean(zero),
                                            that = this,
                                            loop = info.loop;
                                        fnNodeList.insertDomFragment(false, has0 ? zero : false, has0 ? [].slice.call(arguments, 1) : arguments, this[info.finder](), function(element, fragment) {
                                            var wrapper = fragment.childNodes[0],
                                                children = [].slice.call(element.childNodes),
                                                l = loop(that, children);
                                            element.insertBefore(fragment, children[l.min]);
                                            for (var c = l.min; c <= l.max; c++) {
                                                wrapper.appendChild(children[c]);
                                            }
                                        });
                                        return this;
                                    };
                                })(w, wrap[w]);
                            }

                            break;
                    }
                }
            }
        },
        fn: {
            wrapper: {
                inherit: function(mixins, methods, statics) {
                    var toString = coreConst.protobject.toString;
                    if (toString.call(mixins) !== '[object Array]') {
                        if (typeof mixins === 'function') {
                            mixins = [mixins];
                        } else {
                            statics = methods;
                            methods = mixins;
                            mixins = [function(){}];
                        }
                    }

                    var BaseClass;
                    for (var m = 1, ml = mixins.length; m < ml; m++) {
                        var mixin = mixins[m];
                        BaseClass = fnWrapper.inherit([BaseClass || mixins[0]], mixin.prototype, mixin);
                    }

                    BaseClass = BaseClass || mixins[0];
                    methods = methods || {};

                    var FlyClass = (toString.call(methods.__constructor) === '[object Function]' || toString.call(BaseClass.prototype.__constructor) === '[object Function]') ? function() {
                            this.__constructor.apply(this, arguments);
                        } : function() {};

                    for (var p in BaseClass) {
                        if (BaseClass.hasOwnProperty(p)) FlyClass[p] = BaseClass[p];
                    }

                    FlyClass.prototype = Object.create(BaseClass.prototype);
                    FlyClass.prototype.__self = FlyClass.constructor = FlyClass;
                    fnWrapper.override(BaseClass.prototype, FlyClass.prototype, methods)
                    fnWrapper.override(BaseClass, FlyClass, statics);

                    return FlyClass;
                },
                override: function(BaseClass, ResultClass, methods) {
                    var toString = coreConst.protobject.toString;
                    for (var m in methods) {
                        if (m === '__self') continue;
                        var property = methods[m];
                        if (toString.call(property) === '[object Function]' && property.toString().indexOf('.__base') !== -1) {
                            ResultClass[m] = (function(m, property) {
                                var s = BaseClass[m];
                                if (toString.call(s) !== '[object Function]') s = function() {};
                                return function() {
                                    var value = this.__base;
                                    this.__base = s;
                                    var result = property.apply(this, arguments);
                                    this.__base = value;
                                    return result;
                                };
                            })(m, property);
                        } else {
                            ResultClass[m] = property;
                        }
                    }
                },
                subNode: function(root, needSelf, needChildren) {

                },
                unsubNode: function(root, needSelf, needChildren) {
                    var unsub = function(element) {
                            var ecache = (element || {}).ecache;
                            if (ecache) {
                                for (var e = 0, el = ecache.length; e < el; e++) {
                                    var item = ecache[e],
                                        storage = coreCache.handler[item.type];

                                    storage.splice(storage.indexOf(item), 1);
                                    ecache.splice(e--, 1);
                                    el--;
                                }
                            }
                        },
                        walk = function(element) {
                            if (element) {
                                (needSelf || element !== root) && unsub(element);
                                if (needChildren) {
                                    var children = element.children;
                                    for (var c = 0, cl = children.length; c < cl; c++) {
                                        walk(children[c]);
                                    }
                                }
                            }
                        };

                    (root.nodeType === 1 || root.nodeType === 9) && walk(root);
                },
                attachListener: function(realEventName) {
                    if (coreCache.listener[realEventName] !== true) {
                        var listener = function(event) {

                            var handlers = coreCache.handler[realEventName];

                            for (var h in handlers) {

                                var item = handlers[h],
                                    element = item.element,
                                    target = event.target;
                                if (element === window && target === document) target = window;

                                if (target === element || ($.isNode(element) && element.contains(target))) {

                                    while (target !== element.parentNode) {

                                        if ((item.selector && fnStyle.isMatch(target, item.selector + '')) || (!item.selector && target === element)) {

                                            var realNameSpace = event.__namespace,
                                                virtualNameSpace = realNameSpace || item.namespace;

                                            if (virtualNameSpace === item.namespace.substr(0, virtualNameSpace.length)) {
                                                extra = event.__extra || [];
                                                event.data = event.data || $.extend({}, item.data, event.__data);
                                                event.flyTarget = target;
                                                event.delegateTarget = element;

                                                delete event.__extra;
                                                delete event.__data;
                                                delete event.__namespace;

                                                extra.unshift(event);
                                                item.wrapper.apply(item.context || target, extra);
                                                extra.shift();

                                                event.__namespace = realNameSpace;
                                                event.__extra = extra;
                                            }

                                            break;
                                        } else if (element === window) {
                                            target = undefined;
                                        } else {
                                            target = target.parentNode;
                                        }

                                    }
                                }

                            }

                        };
                        if (realEventName === 'resize' || realEventName === 'popstate') {
                            window.addEventListener(realEventName, listener, false);
                        } else {
                            document.addEventListener(realEventName, listener, false);
                        }
                        coreCache.listener[realEventName] = true;
                    }
                }
            },
            classList: {
                argsToClassList: function(args) {
                    var list = [];
                    for (var a = 0, al = args.length; a < al; a++) {
                        list.push.apply(list, args[a].replace(/\s{2,}/g, ' ').trim().split(' '));
                    }
                    return list;
                },
                changeClassList: function(th, action, args) {
                    if (action === 'toggle' && $.isBoolean(args[0])) {
                        action = args[0] ? 'add' : 'remove';
                        args = args.slice(1);
                    }
                    var list = fnClassList.argsToClassList(args),
                        cl = list.length;
                    return th.each(function(element) {
                        for (var c = 0; c < cl; c++) {
                            element.classList[action](list[c]);
                        }
                    });
                }
            },
            nodeList: {
                getFlyDomNode: function(query, context) {
                    var result = [];
                    if ($.isString(query)) {
                        if (query.indexOf('<') === -1) {
                            var string = ('' + query).split(',');
                            for (var s = 0, sl = string.length; s < sl; s++) {
                                var subquery = string[s].trim();
                                if (subquery[0] === '#' && !~subquery.indexOf(' ') && !~subquery.indexOf('>') && !~subquery.indexOf('+') && !~subquery.indexOf('~')) {
                                    var item = document.getElementById(subquery.substr(1));
                                    if (item && result.indexOf(item) === -1) result.push(item);
                                } else {
                                    return context ? (new FlyDomNode(context)['find'](query)) : (new FlyDomNode(document.querySelectorAll(query)));
                                }
                            }
                        } else {
                            return $.new(query);
                        }
                    } else {
                        result = query;
                    }
                    return new FlyDomNode(result);
                },
                isNormal: function(element) {
                    return element !== document && element !== document.documentElement && element !== window;
                },
                makeDomNodeArray: function(args) {
                    if ($.isNodeList(args) || $.isArray(args) || args instanceof FlyDomNode) {
                        return args;
                    } else if ($.isNode(args) || $.isWindow(args)) {
                        return [args];
                    } else if ($.isString(args)) {
                        return document.querySelectorAll(args);
                    }
                    return [];
                },
                cloneNode: function(root) {
                    var result = root.cloneNode(true),
                        sub = function(original, clone) {
                            var ecache = (original || {}).ecache;
                            if (ecache) {
                                clone.ecache = [];
                                for (var e = 0, el = ecache.length; e < el; e++) {
                                    var cItem = {},
                                        oItem = ecache[e];
                                    for (var i in oItem) {
                                        cItem[i] = oItem[i];
                                    }
                                    cItem.element = clone;
                                    var storage = coreCache.handler[cItem.type];
                                    clone.ecache.push(cItem);
                                    storage.push(cItem);
                                }
                            }
                        },
                        walk = function(original, clone) {
                            if (original) {
                                sub(original, clone);

                                var children = original.childNodes;
                                for (var c = 0, cl = children.length; c < cl; c++) {
                                    walk(children[c], clone.childNodes[c]);
                                }
                            }
                        };

                    (root.nodeType === 1 || root.nodeType === 11) && walk(root, result);

                    return result;
                },
                insertDomFragment: function(needResult, keepOriginal, materials, containers, callback) {
                    var fragment = document.createDocumentFragment(),
                        collection = [],
                        result = [],
                        appendArray = function(nodes) {
                            for (var n = 0, nl = nodes.length; n < nl; n++) {
                                fragment.appendChild(keepOriginal ? nodes[n] : fnNodeList.cloneNode(nodes[n]));
                            }
                        };

                    for (var m = 0, ml = materials.length; m < ml; m++) {
                        var material = materials[m];
                        appendArray(fnNodeList.makeDomNodeArray($.isString(material) ? $.new(material) : material));
                    }

                    for (var c = 0, cl = containers.length; c < cl; c++) {
                        collection.push(fnNodeList.makeDomNodeArray(containers[c]));
                    }

                    for (c = 0, cl = collection.length; c < cl; c++) {
                        $.each(collection[c], function(element) {
                            if ($.isNode(element)) {
                                var clone = keepOriginal ? fragment : fnNodeList.cloneNode(fragment),
                                    children = clone.childNodes;
                                if (needResult) {
                                    for (var r = 0, rl = children.length; r < rl; r++) {
                                        result.push(children[r]);
                                    }
                                }
                                callback(element, clone);
                            }
                        });
                    }

                    return needResult ? new FlyDomNode(result) : undefined;
                },
                transformNodeContext: function(th, callback) {
                    var context = [];
                    $.each(th, function(item) {
                        callback(item, context);
                    });
                    return new th.__self(context);
                },
                changeNodeContext: function(th, flyNode, callback) {
                    if (!(flyNode instanceof th.__self)) flyNode = new th.__self(flyNode);
                    var result = th.slice(),
                        context = flyNode;
                    for (var c = 0, cl = context.length; c < cl; c++) {
                        callback(context[c], result);
                    }
                    return new th.__self(result);
                }
            },
            dom: {
                show: function(element) {
                    if ($.isNode(element) && element.nodeType === 1) {
                        var current = fnStyle.getStyle(element, 'display');
                        if (current === 'none') {
                            var a = 'data-last-display';
                            element.style.display = element.hasAttribute(a) ? element.getAttribute(a) : '';
                            current = fnStyle.getStyle(element, 'display');
                            if (current === 'none') {
                                var nodeName = element.nodeName,
                                    body = document.body,
                                    display;

                                if (coreCache.display[nodeName]) {
                                    display = coreCache.display[nodeName];
                                } else {
                                    var test = document.createElement(nodeName);
                                    body.appendChild(test);
                                    display = fnStyle.getStyle(test, 'display');
                                    body.removeChild(test);
                                    if (display === 'none') display = 'block';
                                    coreCache.display[nodeName] = display;
                                }

                                element.setAttribute('data-last-display', element.style.display = display);
                            }
                        }
                    }
                },
                hide: function(element) {
                    var current = fnStyle.getStyle(element, 'display');
                    element.setAttribute('data-last-display', current);
                    element.style.display = 'none';
                },
                cancelQueue: function(th, method) {
                    return th.each(function(element) {
                        var queue = element.__queue;
                        queue && queue[method]();
                    });
                }
            },
            style: {
                getStyle: function(element, property) {
                    if ($.isNode(element)) {
                        var style = window.getComputedStyle(element);
                        if ((property === 'width' && style.width === 'auto') || (property === 'height' && style.height === 'auto')) {
                            style = {};
                            style[property] = element['offset' + fnCommon.capFirst(property)] + 'px';
                        }
                    } else if (element !== window) {
                        return null;
                    } else {
                        var style = {};
                    }

                    if (!property) {
                        return style;
                    } else {
                        var hook = fnStyle.getTool('hook', property);

                        if (!$.isFunction(hook.get)) {
                            var value = style[property];
                            if (value === undefined) {
                                return style[fnCommon.withPrefix(property, 1)];
                            } else {
                                return value;
                            }
                        } else {
                            return hook.get(element, style);
                        }
                    }
                },
                setStyle: function(style, property, value) {
                    if ($.isNode(style) || style === window) {
                        var element = style,
                            style = element.style;
                    }
                    var hook = coreData.hook.css[property];
                    if (!hook || !$.isFunction(hook.set)) {
                        if (style[property] === undefined) property = fnCommon.withPrefix(property, 1);
                        style[property] = value;
                    } else {
                        hook.set(element, style, value);
                    }
                },
                sumStyle: function(element) {
                    var result = 0;
                    for (var a = 1, al = arguments.length; a < al; a++) {
                        var property = arguments[a],
                            sign = property[0] === '-' ? -1 : 1,
                            value = parseFloat(fnStyle.getStyle(element, property = property.replace(/^[-+]/, '')));
                        result += sign * value;
                    }
                    return result;
                },
                getSizeDismensions: function(element, sum) {
                    var result,
                        calc = function(box) {
                            sum[box].unshift(element);
                            result = fnStyle.sumStyle.apply(this, sum[box]);
                        };

                    if (!$.isNode(element)) return null;

                    switch(fnStyle.getStyle(element, 'boxSizing')) {
                        case 'border-box': calc('border'); break;
                        case 'padding-box': calc('padding'); break;
                        default: calc('content');
                    }
                    return result;
                },
                getScrollDismensions: function(element, position, size) {
                    var result = {};
                    result[position.toLowerCase()] = element['scroll' + position];
                    result[size.toLowerCase()] = element['scroll' + size];
                    return result;
                },
                isMatch: function(element, selector) {
                    var result;
                    try {
                        result = !$.isString(selector) || element[fnCommon.withPrefix('matchesSelector')](selector);
                    } catch(e) {
                        result = false;
                    }
                    return result;
                },
                getTool: function(query, property) {
                    var hook = coreData.hook.css[property] || {};
                    if (query === 'hook') {
                        return hook;
                    } else {
                        if (hook[query]) return hook[query];

                        var map = coreConst.map.property;
                        query = fnCommon.capFirst(query);
                        if (~map.one.indexOf(property)) return fnStyle['oneSize' + query];
                        if (~map.two.indexOf(property)) return fnStyle['twoSize' + query];
                        if (~map.multi.indexOf(property)) return fnStyle['multiSize' + query];
                        return fnStyle['noSize' + query];
                    }
                },
                noSizeCalc: function(action, one, two) {
                    return two === 'current' ? one : two;
                },
                oneSizeCalc: function(action, one, two) {
                    if (two === 'current') {
                        var decodeOne = one.split('_');
                        one = two = decodeOne[0];
                    }
                    switch(action) {
                        case '+=': return +one + +two;
                        case '-=': return +one - two;
                        default: return +two;
                    }
                },
                noSizeStep: function(from, to, unit, delta) {
                    return to + (unit === 'current' ? '' : unit);
                },
                oneSizeStep: function(from, to, unit, delta) {
                    if (unit === 'current') {
                        var decodeFrom = from.split('_');
                        from = decodeFrom[0];
                        unit = decodeFrom[1];
                    }
                    return +from + (+to - from) * delta + unit;
                },
                noSizeParser: function(string, property, data4convert) {
                    return {value: string, unit: '', status: true};
                },
                oneSizeParser: function(string, property, data4convert) {
                    var value = null,
                        unit = null;

                    if (!data4convert || data4convert.unit === 'current') {
                        var matches = string.match(/^\s*(current|[-+]?\d+(?:\.\d+)?)\s*(px|pt|pc|em|ex|in|cm|mm|%|rad|deg|grad|turn)?\s*$/i);
                        if (matches) {
                            if (matches[1] === 'current') {
                                value = unit = 'current';
                            } else if (data4convert && data4convert.unit === 'current') {
                                value = matches[1] + '_' + (matches[2] || '');
                                unit = '';
                            } else {
                                if (!matches[2]) {
                                    if (['opacity', 'scaleX', 'scaleY', 'scale'].indexOf(property) !== -1) {
                                        matches[2] = '';
                                    } else if (['skewX', 'skewY', 'skew', 'rotateX', 'rotateY', 'rotate', 'rotate3d'].indexOf(property) !== -1) {
                                        matches[2] = 'deg';
                                    } else {
                                        matches[2] = 'px';
                                    }
                                }
                                value = +matches[1];
                                unit = matches[2];
                            }
                        }
                    } else if (data4convert.unit === '') {
                        value = +string;
                        unit = '';
                    } else {
                        value = fnConverter.valueTo(data4convert.element, property, string, unit = data4convert.unit);
                    }

                    return {
                        value: value,
                        unit: unit,
                        status: value === 'current' || $.isNumber(value)
                    };
                },
                actionParser: function(string) {
                    var matches = string.match(/^\s*(\-=|\+=|=)/),
                        action = '=';

                    if (matches) {
                        action = matches[1];
                        string = string.substr(string.indexOf(action) + action.length);
                    }

                    return {
                        action: action,
                        value: string
                    };
                }
            },
            common: {
                testPrefix: function(string, style) {
                    if (coreConst.span.style[string] === undefined) {
                        return fnCommon.withPrefix(string, style);
                    } else {
                        return string;
                    }
                },
                capFirst: function(s) {
                    s += '';
                    return s[0].toUpperCase() + s.substr(1);
                },
                withPrefix: function(string, style) {
                    var capFirst = fnCommon.capFirst,
                        prefix = $.browser().prefix;
                    string += '';
                    if (prefix === '') {
                        return string;
                    } else {
                        if (string === 'transitionEnd') {
                            if ($.browser().trident) prefix = 'MS';
                            if ($.browser().gecko) return 'transitionend';
                        }
                        switch (style) {
                            case 1: if (prefix === 'moz') prefix = capFirst(prefix); break;
                            case 2: prefix = capFirst(prefix);
                        }
                        return prefix + capFirst(string);
                    }
                },
                extremum: function(method, list, iterator) {
                    var i = ({max: -1, min: 1})[method];
                    if (iterator === undefined) {
                        if ($.isArray(list)) {
                            return Math[method].apply(Math, list);
                        } else {
                            var m = i * Infinity;
                            $.each(list, function(item) {
                                if (item * i < m * i) m = item;
                            });
                            return m;
                        }
                    } else {
                        var m = result = i * Infinity;
                        $.each(list, function(item, index) {
                            var value = iterator.call(item, item, index, list);
                            if (value * i < m * i) {
                                result = item;
                                m = value;
                            }
                        });
                        return result;
                    }
                },
                applyMap: function(map, string) {
                    if (string === null || string === undefined) return '';
                    return (string + '').replace(coreConst.regex[map], function(match) {
                        return coreConst.map[map][match];
                    });
                },
                changePreset: function(action, method, name, options) {
                    if (method === 'stylize' || method === 'animate' || method === 'ajax') {
                        if (action === 'set') {
                            corePreset.user[method][name] = options;
                            return true;
                        } else {
                            if (name === undefined) {
                                corePreset.user[method] = {};
                                return true;
                            } else {
                                return delete corePreset.user[method][name];
                            }
                        }
                    } else {
                        return false;
                    }
                }
            },
            converter: {
                hslToRgb: function(h, s, l) {
                    var r, g, b;

                    h *= 1 / 360;
                    s *= 0.01;
                    l *= 0.01;

                    var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
                        p = 2 * l - q,
                        hueToRgb = function(t) {
                            if (t < 0) t += 1;
                            if (t > 1) t -= 1;
                            if (t < 1 / 6) return p + (q - p) * 6 * t;
                            if (t < 1 / 2) return q;
                            if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
                            return p;
                        };

                    r = hueToRgb(h + 1 / 3);
                    g = hueToRgb(h);
                    b = hueToRgb(h - 1 / 3);
                    return [r * 255, g * 255, b * 255];
                },
                hsvToRgb: function(h, s, v) {
                    var r, g, b;

                    h *= 1 / 360;
                    s *= 0.01;
                    v *= 0.01;

                    var i = Math.floor(h * 6),
                        f = h * 6 - i,
                        p = v * (1 - s),
                        q = v * (1 - f * s),
                        t = v * (1 - (1 - f) * s);

                    switch(i % 6) {
                        case 0: r = v; g = t; b = p; break;
                        case 1: r = q; g = v; b = p; break;
                        case 2: r = p; g = v; b = t; break;
                        case 3: r = p; g = q; b = v; break;
                        case 4: r = t; g = p; b = v; break;
                        case 5: r = v; g = p; b = q; break;
                    }

                    return [r * 255, g * 255, b * 255];
                },
                valueToDegrees: function(th, property, value, unit) {
                    switch(unit) {
                        case 'rad': return 180 * value / Math.PI;
                        case 'grad': return 9 * value / 10;
                        case 'turn': return value * 360;
                        default: return value;
                    }
                },
                valueFromDegrees: function(th, property, value, unit) {
                    switch(unit) {
                        case 'rad': return Math.PI * value / 180;
                        case 'grad': return 10 * value / 9;
                        case 'turn': return value / 360;
                        default: return value;
                    }
                },
                valueFromPixels: function(th, property, value, unit) {
                    switch(unit) {
                        case 'pt': return value * 72 / coreConst.ppi;
                        case 'pc': return value * 6 / coreConst.ppi;
                        case 'in': return value / coreConst.ppi;
                        case 'cm': return value * 2.54 / coreConst.ppi;
                        case 'mm': return value * 25.4 / coreConst.ppi;
                        case 'em': return value / parseFloat(fnStyle.getStyle(th, 'fontSize'));
                        case 'ex': return value * 2 / parseFloat(fnStyle.getStyle(th, 'fontSize'));
                        case '%': return 100 * value / parseFloat(fnStyle.getStyle(th.parentNode, property === 'width' ? 'width' : 'height'));
                        default: return value;
                    }
                },
                valueToPixels: function(th, property, value, unit) {
                    switch(unit) {
                        case 'pt': return value * coreConst.ppi * 1/72;
                        case 'pc': return value * coreConst.ppi * 1/6;
                        case 'in': return value * coreConst.ppi;
                        case 'cm': return value * coreConst.ppi / 2.54;
                        case 'mm': return value * coreConst.ppi / 25.4;
                        case 'em': return value * parseFloat(fnStyle.getStyle(th, 'fontSize'));
                        case 'ex': return value * parseFloat(fnStyle.getStyle(th, 'fontSize')) / 2;
                        case '%': return value * parseFloat(fnStyle.getStyle(th.parentNode, property === 'width' ? 'width' : 'height')) / 100;
                        default: return value;
                    }
                },
                valueTo: function(th, property, value, to) {
                    value += '';

                    var from,
                        fromConverter,
                        toConverter,
                        matches = value.match(/^\s*(\-?\d+(?:\.\d+)?)\s*(px|pt|pc|em|ex|in|cm|mm|%)?\s*$/);

                    if (matches) {
                        from = 'px',
                        fromConverter = fnConverter.valueFromPixels,
                        toConverter = fnConverter.valueToPixels;
                    } else {
                        matches = value.match(/^\s*(\-?\d+(?:\.\d+)?)\s*(deg|grad|rad|turn)?\s*$/);
                        if (matches) {
                            from = 'deg',
                            fromConverter = fnConverter.valueFromDegrees,
                            toConverter = fnConverter.valueToDegrees;
                        }
                    }

                    if (matches) {
                        value = +matches[1];
                        from = matches[2] || from;
                        if (from === to) {
                            return value;
                        } else {
                            return fromConverter(th, property, toConverter(th, property, value, from), to);
                        }
                    } else {
                        return null;
                    }
                },
                stringToCamelCase: function(string) {
                    string += '';
                    return string.indexOf('-') === -1 ? string : string.toLowerCase().replace(/(-[a-z])/g, function(s) {
                        return s[1].toUpperCase();
                    });
                },
                stringToHyphenCase: function(string) {
                    string += '';
                    return string.indexOf('-') === -1 ? string.replace(/[A-Z]/g, '-$&').toLowerCase() : string;
                }
            }
        }
    };

    var scope = this,
        core = FlyCore,
        coreConstructor = core.constructor,
        coreGlobal = core.global,
        coreConst = core.const,
        coreCache = core.cache,
        coreData = core.data,
        coreFn = core.fn,
        corePreset = core.preset,
        fnWrapper = coreFn.wrapper,
        fnClassList = coreFn.classList,
        fnNodeList = coreFn.nodeList,
        fnStyle = coreFn.style;
        fnDom = coreFn.dom;
        fnConverter = coreFn.converter;
        fnCommon = coreFn.common,
        constructor = {
            FlyDomNode: {
                __constructor: function(context) {
                    var array = fnNodeList.makeDomNodeArray(context);
                    for (var a = 0, al = array.length; a < al; a++) {
                        this[a] = array[a];
                    }
                    this.length = al;
                },

                size: function() {
                    return this.length;
                },

                get: function(index) {
                    return $.isNumber(index) ? this[index] : [].slice.call(this);
                },

                addNode: function(flyNode) {
                    return fnNodeList.changeNodeContext(this, flyNode, function(child, context) {
                        context.indexOf(child) === -1 && context.push(child);
                    });
                },

                removeNode: function(flyNode) {
                    return fnNodeList.changeNodeContext(this, flyNode, function(child, context) {
                        var position = context.indexOf(child);
                        if (position !== -1) context.splice(position, 1);
                    });
                },

                eq: function(index) {
                    if (index < 0) index = index + this.length;
                    return new this.__self(this[index]);
                },

                lt: function(index) {
                    return new this.__self(this.slice(0, index + 1));
                },

                gt: function(index) {
                    return new this.__self(this.slice(index));
                },

                last: function(selector) {
                    var element = this[this.length - 1];
                    return new this.__self(fnStyle.isMatch(element, selector) ? element : []);
                },

                first: function(selector) {
                    var element = this[0];
                    return new this.__self(fnStyle.isMatch(element, selector) ? element : []);
                },

                normalize: function() {
                    return fnNodeList.transformNodeContext(this, function(item, context) {
                        if ($.isNode(item) && fnNodeList.isNormal(item)) context.push(item);
                    });
                },

                each: function(callback, context) {
                    $.each(this, callback, context);
                    return this;
                },

                tag: function() {
                    return this[0].tagName.toLowerCase() || null;
                },

                once: function() {
                    return this.on.apply({context: this, __once: true}, arguments);
                },

                on: function(enames, selector, data, handler, context) {
                    if ($.isFunction(selector)) {
                        context = data;
                        handler = selector;
                        selector = data = undefined;
                    } else if ($.isFunction(data)) {
                        context = handler;
                        handler = data;
                        if ($.isString(selector)) {
                            data = undefined;
                        } else {
                            data = selector;
                            selector = undefined;
                        }
                    }

                    if (this.__once === true) {
                        var that = this.context,
                            wrapper = function() {
                                that.off(enames, selector, wrapper, context);
                                handler.apply(this, arguments);
                            };
                        return that.on(enames, selector, data, wrapper, context);
                    } else {
                        enames = (enames + '').replace(/\s{2,}/g, ' ').trim().split(' ');
                        var el = enames.length;

                        return this.each(function(element) {

                            for (var e = 0; e < el; e++) {

                                var ename = enames[e] + '.',
                                    hookEventName = ename.substr(0, ename.indexOf('.')),
                                    realEventName,
                                    wrapper,
                                    hook = coreData.hook.event[hookEventName];

                                if (hook) {
                                    realEventName = hook.name;
                                    wrapper = hook.wrap(handler);
                                } else {
                                    realEventName = hookEventName;
                                    wrapper = handler;
                                }

                                var storage = coreCache.handler[realEventName] = coreCache.handler[realEventName] || [],
                                    ecache = element.ecache = element.ecache || [],
                                    sub = {
                                        context: context,
                                        data: data,
                                        element: element,
                                        handler: handler,
                                        type: realEventName,
                                        namespace: ename,
                                        selector: selector,
                                        wrapper: wrapper
                                    };

                                fnWrapper.attachListener(realEventName);
                                ecache.push(sub);
                                storage.push(sub);
                            }
                        });
                    }
                },

                off: function(enames, selector, handler, context) {
                    enames = (enames + '').replace(/\s{2,}/g, ' ').trim().split(' ');
                    var el = enames.length,
                        isZero = arguments[0] === undefined;

                    if ($.isFunction(selector)) {
                        context = handler;
                        handler = selector;
                        selector = undefined;
                    } else if ($.isObject(selector)) {
                        context = selector;
                        handler = selector = undefined;
                    }

                    return this.each(function(element) {
                        if (isZero) enames = Object.keys(coreCache.handler);

                        for (var e = 0, el = enames.length; e < el; e++) {
                            var ename = enames[e] + '.',
                                hookEventName = ename.substr(0, ename.indexOf('.')),
                                hook = coreData.hook.event[hookEventName],
                                realEventName = hook ? hook.name : hookEventName,
                                storage = coreCache.handler[realEventName];

                            if (storage) {
                                for (var s = 0, sl = storage.length; s < sl; s++) {
                                    var item = storage[s];

                                    if (element === item.element &&
                                        (isZero || item.namespace.substr(0, ename.length) === ename) &&
                                        (!selector || item.selector === selector) &&
                                        (!context || item.context === context) &&
                                        (!handler || item.handler === handler)) {

                                        var ecache = element.ecache;
                                        ecache && ecache.splice(ecache.indexOf(item), 1);
                                        storage.splice(s--, 1);
                                        sl--;
                                    }
                                }
                            }
                        }
                    });
                },

                emit: function(ename, extra, data) {
                    if (arguments.length === 2 && $.isObject(extra)) {
                        data = extra;
                        extra = undefined;
                    }
                    ename = (ename + '').replace(/\s{2,}/g, ' ').trim().split(' ');

                    for (var e = 0, el = ename.length; e < el; e++) {
                        var hookEventName = ename[e].substr(0, (ename[e] + '.').indexOf('.')),
                            hook = coreData.hook.event[hookEventName],
                            realEventName = hook ? hook.name : hookEventName,
                            event = document.createEvent('HTMLEvents');

                        event.initEvent(realEventName, true, true);
                        event.__namespace = ename[e] + '.';
                        if (data !== undefined) event.__data = data;
                        if (extra !== undefined) event.__extra = $.isArray(extra) ? extra : [extra];

                        this.each(function(element) {
                            element.dispatchEvent(event);
                        });
                    }
                    return this;
                },

                parent: function(selector) {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        var parent = element.parentNode;
                        if (parent && context.indexOf(parent) === -1 && fnStyle.isMatch(parent, selector)) context.push(parent);
                    });
                },

                parents: function(selector) {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        var parent = element;
                        while (parent = parent.parentNode) {
                            if (context.indexOf(parent) === -1 && fnStyle.isMatch(parent, selector) && parent !== document) context.push(parent);
                        }
                    });
                },

                closest: function(selector) {
                    var context = [];
                    if (selector === undefined) {
                        var parent = this.first()[0];

                        if ($.isNode(parent)) {
                            var cl = this.length;
                            if (cl > 1) {
                                var result,
                                    context = this;
                                while (!result && parent !== document) {
                                    var all = true;
                                    for (var c = 1; c < cl; c++) {
                                        if (!parent.contains(context[c])) {
                                            all = false;
                                            parent = parent.parentNode;
                                            break;
                                        }
                                    }
                                    if (all) result = parent;
                                }
                                context = result ? [parent] : [];
                            } else {
                                context = [parent.parentNode];
                            }
                        }
                    } else {
                        this.each(function(element) {
                            var parent = element;
                            do {
                                if (fnStyle.isMatch(parent, selector)) {
                                    if (context.indexOf(parent) === -1) context.push(parent);
                                    break;
                                } else {
                                    parent = parent.parentNode;
                                }
                            } while (parent !== document);
                        });
                    }
                    return new FlyDomNode(context);
                },

                children: function(selector) {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        var children = element.children;
                        for (var c = 0, cl = children.length; c < cl; c++) {
                            var child = children[c];
                            if (context.indexOf(child) === -1 && fnStyle.isMatch(child, selector)) context.push(child);
                        }
                    });
                },

                siblings: function(selector) {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        var siblings = element.parentNode.children;
                        for (var s = 0, sl = siblings.length; s < sl; s++) {
                            var sibling = siblings[s];
                            if (context.indexOf(sibling) === -1 && sibling !== element && fnStyle.isMatch(sibling, selector)) context.push(sibling);
                        }
                    });
                },

                find: function(query) {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        var items = element.querySelectorAll(query);
                        for (var i = 0, il = items.length; i < il; i++) {
                            var item = items[i];
                            if (context.indexOf(item) === -1) context.push(item);
                        }
                    });
                },

                empty: function() {
                    fnNodeList.transformNodeContext(this, function(element, context) {
                        fnWrapper.unsubNode(element, false, true);
                        var children = element.childNodes;
                        while (children.length > 0) {
                            element.removeChild(children[0]);
                        }
                    });
                    return this;
                },

                remove: function(selector, __isCut) {
                    var list = [];
                    for (var n = 0, nl = this.length; n < nl; n++) {
                        var node = this[n];
                        if (fnStyle.isMatch(node, selector)) list.push(node);
                    }
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        if (list.indexOf(element) !== -1) {
                            __isCut !== true && fnWrapper.unsubNode(element, true, true);
                            context.push(element.parentNode.removeChild(element));
                        }
                    });
                },

                has: function(node) {
                    var result = false,
                        target = fnNodeList.makeDomNodeArray(node)[0];
                    if (target) this.each(function(element) {
                        if (element.contains(target)) {
                            result = true;
                            return false;
                        }
                    });
                    return result;
                },

                is: function(selector) {
                    var result = this.length !== 0;
                    this.each(function(element) {
                        if (!fnStyle.isMatch(element, selector)) return result = false;
                    });
                    return result;
                },

                hasClass: function() {
                    var list = fnClassList.argsToClassList(arguments),
                        cl = list.length,
                        result = this.length !== 0;
                    this.each(function(element) {
                        for (var c = 0; c < cl; c++) {
                            if (!element.classList.contains(list[c])) return result = false;
                        }
                    });
                    return result;
                },

                toggle: function(selector) {
                    this.each(function(element) {
                        if (fnStyle.isMatch(element, selector)) {
                            if (fnStyle.getStyle(element, 'display') === 'none') {
                                fnDom.show(element);
                            } else {
                                fnDom.hide(element);
                            }
                        }
                    });
                    return this;
                },

                queue: function(command) {
                    if (command === 'stop' || command === 'clear') fnDom.cancelQueue(this, command);
                    return this;
                },

                animate: function(cssArg, animateArg) {
                    var argNames = {0: 'stylize', 1: 'animate'},
                        argValues = {
                            stylize: $.isArray(cssArg) ? cssArg : [cssArg],
                            animate: $.isArray(animateArg) ? animateArg : [animateArg]
                        },
                        params = {
                            stylize: {},
                            animate: {}
                        };
                    for (var o = 0; o < 2; o++) {
                        var name = argNames[o],
                            arg = argValues[name];
                        for (var a = 0, al = arg.length; a < al; a++) {
                            var item = arg[a];
                            if ($.isString(item)) item = corePreset.user[name][item] || {};
                            $.extend(true, params[name], item);
                        }
                    }
                    options = params.animate;

                    var callback = ['step', 'complete', 'success', 'error'];
                    for (var c = 0, cl = callback.length; c < cl; c++) {
                        var cbname = callback[c];
                        if (!$.isFunction(options[cbname])) options[cbname] = null;
                    }

                    var method = {css: 0, js: 1};

                    if (options.method !== 'js') options.method = 'css';

                    options.easingName = options.easing;
                    options.easing = coreData.easing[options.method][options.easing];
                    !options.easing && (options.easing = coreData.easing[options.method][options.easingName = 'linear']);

                    options.method = method[options.method];

                    var css = options.css = {};
                    for (var s in params.stylize) {
                        var string = params.stylize[s] + '',
                            name = fnConverter.stringToCamelCase(s),
                            parser = fnStyle.getTool('parser', name),
                            matches = fnStyle.actionParser(string),
                            property = parser(matches.value, name);

                        if ($.isObject(property) && property.status) {
                            css[name] = property;
                            css[name].action = matches.action;
                        } else {
                            continue;
                        }
                    }

                    options.queue = options.queue === false ? false : true;
                    if (isNaN(options.duration = +options.duration)) options.duration = 400;

                    return this.each(function(element) {
                        var queue = element.__queue || (element.__queue = new FlyDomQueue({element: element}));
                        queue.add(options);
                        window.requestAnimationFrame(queue.render);
                    });
                },

                delay: function(options) {
                    if ($.isString(options)) options = $.extend({}, corePreset.user.animate.default, corePreset.user.animate[options]);
                    if (!$.isObject(options)) options = {duration: options};
                    if (isNaN(options.duration *= 1)) options.duration = 400;
                    return this.each(function(element) {
                        var queue = element.__queue || (element.__queue = new FlyDomQueue({element: element}));
                        queue.delay(options);
                    });
                },

                val: function(value) {
                    if (value === undefined) {
                        if (this.length === 0) {
                            return undefined;
                        } else {
                            var element = this[0];
                            switch(element.type) {
                                case 'checkbox':
                                case 'radio':
                                    return element.checked;
                                default:
                                    return element.value;
                            }
                        }
                    } else {
                        return this.each(function(element) {
                            switch (element.type) {
                                case 'checkbox':
                                case 'radio':
                                    element.checked = !!value;
                                default:
                                    element.value = value;
                            }
                        });
                    }
                },

                serialize: function() {
                    var result = [];
                    this.each(function(element) {
                        if (element.tagName.toLowerCase() === 'form') {
                            var children = element.elements;
                            for (var c = 0, cl = children.length; c < cl; c++) {
                                var child = children[c];
                                if (child.name !== '') {
                                    switch(child.tagName.toLowerCase()) {
                                        case 'input':
                                            switch (child.type.toLowerCase()) {
                                                case 'text':
                                                    result.push(child.name + '=' + window.encodeURIComponent(child.value));
                                                    break;
                                                case 'radio':
                                                    if (child.checked) result.push(child.name + '=' + window.encodeURIComponent(child.value));
                                                    break;
                                                case 'checkbox':
                                                    if (child.checked) result.push(child.name + '=on');
                                            }
                                            break;
                                        case 'textarea':
                                            result.push(child.name + '=' + window.encodeURIComponent(child.value));
                                            break;
                                        case 'select':
                                            var options = child.options;
                                            for (var o = 0, ol = options.length; o < ol; o++) {
                                                var option = options[o];
                                                if (option.selected) result.push(child.name + '=' + window.encodeURIComponent(options[o].value));
                                            }
                                    }
                                }
                            }
                        }
                    });
                    return result.join('&');
                },

                stylize: function() {
                    var preset = {},
                        array = arguments;
                    if ($.isArray(array[0])) array = array[0];
                    for (var a = 0, al = array.length; a < al; a++) {
                        var item = array[a];
                        if ($.isString(item)) item = corePreset.user.stylize[item];
                        $.extend(true, preset, item);
                    }
                    this.css(preset);
                    return this;
                },

                hasAttr: function() {
                    var list = fnClassList.argsToClassList(arguments),
                        al = list.length,
                        result = this.length !== 0;
                    this.each(function(element) {
                        for (var a = 0; a < al; a++) {
                            if (!element.hasAttribute(list[a])) return result = false;
                        }
                    });
                    return result;
                },

                removeAttr: function() {
                    var attr = fnClassList.argsToClassList(arguments),
                        al = attr.length;
                    this.each(function(element) {
                        for (var a = 0; a < al; a++) {
                            element.removeAttribute(attr[a]);
                        }
                    });
                    return this;
                },

                offset: function() {
                    if (this.length === 0) {
                        return null;
                    } else {
                        var element = this[0],
                            rect = element.getBoundingClientRect();
                        return {
                            left: Math.round(rect.left + window.pageXOffset),
                            right: Math.round(rect.right + window.pageXOffset),
                            top: Math.round(rect.top + window.pageYOffset),
                            bottom: Math.round(rect.bottom + window.pageYOffset)
                        };
                    }
                },

                offsetParent: function() {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        var parent = element,
                            position = 'auto',
                            root = document.documentElement;
                        while ((position === 'auto' || position === 'static') && (parent = parent.parentNode) !== root) {
                            position = fnStyle.getStyle(parent, 'position');
                        }
                        if (context.indexOf(parent) === -1) context.push(parent);
                    });
                },

                position: function() {
                    if (this.length === 0) {
                        return null;
                    } else {
                        var node = this.eq(0),
                            parent = fnStyle.getStyle(node, 'position') === 'fixed' ? $(document.documentElement) : node.offsetParent(),
                            no = node.offset(),
                            po = parent.offset(),
                            border = function(p) {
                                return parseInt(parent.css('border' + p + 'Width'));
                            };

                        return {
                            left: no.left - po.left - border('Left'),
                            top: no.top - po.top - border('Top'),
                            right: po.right - no.right - border('Right'),
                            bottom: po.bottom - no.bottom - border('Bottom')
                        };
                    }
                },

                scroll: function(x, y) {
                    if (arguments.length === 0) {
                        return this.length ? $.extend(this.scrollX(), this.scrollY()) : null;
                    } else {
                        return this.scrollX(x).scrollY(y);
                    }
                },

                clone: function(selector) {
                    return fnNodeList.transformNodeContext(this, function(element, context) {
                        if (fnStyle.isMatch(element, selector)) context.push(fnNodeList.cloneNode(element));
                    });
                },

                save: function(key) {
                    if (coreData.dom[key]) $.delete(key);
                    if ($.isString(key)) coreData.dom[key] = new FlyDomNode(this.get());
                    return this;
                },

                cut: function(key) {
                    if (coreData.dom[key]) $.delete(key);
                    return $.isString(key) ? (coreData.dom[key] = this.remove(undefined, true)) : undefined;
                },

                copy: function(key) {
                    if (coreData.dom[key]) $.delete(key);
                    if ($.isString(key)) coreData.dom[key] = this.clone();
                    return this;
                },

                replaceWith: function(zero) {
                    var context = [],
                        has0 = $.isBoolean(zero);
                    fnNodeList.insertDomFragment(false, has0 ? zero : false, has0 ? [].slice.call(arguments, 1) : arguments, this, function(element, fragment) {
                        fnWrapper.unsubNode(element, true, true);
                        element.parentNode.insertBefore(fragment, element);
                        context.push(element.parentNode.removeChild(element));
                    });
                    return new FlyDomNode(context);
                },

                unwrap: function(selector) {
                    $.each(this.parent(), function(element) {
                        if (fnStyle.isMatch(element, selector)) {
                            var parent = $(element);
                            parent.replaceWith(true, parent.children());
                        }
                    });
                    return this;
                },

                html: function(html) {
                    if (html === undefined) {
                        return this.length === 0 ? null : this[0].innerHTML;
                    } else {
                        this.each(function(element) {
                            fnWrapper.unsubNode(element, false, true);
                            element.innerHTML = html;
                        });
                    }
                    return this;
                },

                select: function(text) {
                    $.selection(!!text, this);
                    return this;
                }
            },
            FlyDomQueue: {
                __constructor: function(options) {
                    for (var o in options) {
                        this[o] = options[o];
                    }
                    this._storage = [];

                    var that = this;
                    this.render = function() {
                        that.next.call(that);
                    };
                },
                delay: function(options) {
                    var delay = {
                            duration: options.duration,
                            state: 0,
                            error: function() {
                                options.error && options.error.call(this.element);
                                delay.finish();
                            },
                            time: {},
                            queue: this,
                            start: function() {
                                delay.state = 1;
                                delay.time.start = $.time().getTime();
                            },
                            next: function() {
                                if ($.time().getTime() - delay.time.start >= options.duration) {
                                    options.success && options.success.call(this.element);
                                    options.complete && options.complete.call(this.element);
                                    delay.finish();
                                } else {
                                    options.step && options.step.call(this.element);
                                }
                            },
                            finish: function() {
                                delay.state = 2;
                                delay.queue.remove('delay');
                            }
                        };
                    this._storage.push({delay: delay});
                    return this._storage.length === 1 ? this.start() : this;
                },
                add: function(options) {
                    var push = options.queue || this._storage.length === 0,
                        tset = push ? {} : this._storage[0],
                        element = this.element,
                        callback = {
                            onStep: options.step,
                            onSuccess: function() {callback.onSuccess = null; $.isFunction(options.success) && options.success.call(element);},
                            onError: function() {callback.onError = null; $.isFunction(options.error) && options.error.call(element);},
                            onComplete: function() {callback.onComplete = null; $.isFunction(options.complete) && options.complete.call(element);}
                        };

                    for (var c in options.css) {
                        if (!options.queue && tset[c]) (this.filter = true) && tset[c].error();
                        var property = options.css[c];
                        tset[c] = new FlyDomTween({
                            name: c,
                            method: options.method,
                            action: property.action,
                            to: property.value,
                            unit: property.unit,
                            duration: options.duration,
                            easing: options.easing,
                            easingName: options.easingName,
                            element: element,
                            callback: callback,
                            queue: this
                        });
                    }
                    if (push) this._storage.push(tset);
                    return this._storage.length === 1 || !options.queue ? this.start() : this;
                },

                next: function() {
                    if (this._storage.length > 0) {
                        var tset = this._storage[0];
                        for (var t in tset) {
                            tset[t].next();
                        }
                        window.requestAnimationFrame(this.render);
                    }
                    return this;
                },

                start: function() {
                    var tset = this._storage[0];
                    for (var t in tset) {
                        if (tset[t].state === 0) tset[t].start();
                    }
                    return this;
                },

                stop: function() {
                    var tset = this.clear()._storage[0];
                    for (var t in tset) {
                        tset[t].error();
                    }
                    return this;
                },

                clear: function() {
                    var storage = this._storage;
                    this._storage = storage.length > 0 ? [storage[0]] : [];
                    return this;
                },

                remove: function(name) {
                    var tset = this._storage[0],
                        that = this;
                    delete tset[name];
                    if (!this.filter && Object.keys(tset).length === 0) {
                        that._storage.shift();
                        if (that._storage.length !== 0) that.start();
                    }
                    this.filter = false;
                    return this;
                },

                setTransition: function(name, value) {
                    var tset = this._storage[0];
                    for (var t in tset) {
                        if (tset[t].transition === name && tset[t].state === 1) tset[t].before = value;
                    }
                    return this;
                }
            },
            FlyDomTween: {
                __constructor: function(options) {
                    for (var o in options) {
                        this[o] = options[o];
                    }
                    this.time = {progress: 0};
                    this.state = 0;

                    var hook = this.hook = fnStyle.getTool('hook', this.name);
                    if (hook.transition === false) {
                        this.method = 1;
                        this.easing = coreData.easing.js[this.easingName] || coreData.easing.js.linear;
                    }

                    if (this.method === 0) {
                        var hookTransitionName = $.isString(hook.transition) ? fnCommon.testPrefix(hook.transition, hook.prefix || 2) : undefined;
                        this.transition = fnConverter.stringToHyphenCase(hookTransitionName || this.name);
                    }
                },

                _getTransition: function() {
                    var matches = (this.element.getAttribute('style') || '').match(/(?:^|\s|;)transition:\s*(.*?)(?:$|;)/),
                        string = (matches ? matches[1] : 'all 0 ease 0').replace(/\(.*?\)/g, function(temp) {
                            return temp.replace(/,/g, ';').replace(/\s+/g, '');
                        }),
                        posProperty = string.lastIndexOf(this.transition);
                    if (posProperty === -1) {
                        return '';
                    } else {
                        var posComma = string.indexOf(',', posProperty);
                        if (posComma === -1) posComma = string.length;
                        return string.substring(posProperty, posComma).replace(/;/g, ',');
                    }
                },

                _setTransition: function(value) {
                    var matches = (this.element.getAttribute('style') || '').match(/(?:^|\s|;)transition:\s*(.*?)(?:$|;)/),
                        string = (matches ? matches[1] : '').replace(/\(.*?\)/g, function(temp) {
                            return temp.replace(/,/g, ';').replace(/\s+/g, '');
                        }),
                        posProperty = string.lastIndexOf(this.transition);

                    if (posProperty === -1) {
                        this.element.style.transition += (string === '' ? '' : ',') + value;
                    } else {
                        var posComma = string.indexOf(',', posProperty);
                        string = string.replace(/;/g, ',');
                        this.element.style.transition = string.substr(0, posProperty) + value + (posComma === -1 ? '' : string.substr(posComma));
                    }

                    return this;
                },

                start: function() {
                    this.time.start = $.time().getTime();
                    this.time.finish = this.time.start + this.duration;

                    this.from = fnStyle.getTool('parser', this.name)(fnStyle.getStyle(this.element, this.name), this.name, {element: this.element, unit: this.unit}).value;
                    this.to = fnStyle.getTool('calc', this.name)(this.action, this.from, this.to);
                    this.step = fnStyle.getTool('step', this.name);

                    var that = this;

                    if (this.method === 0) {
                        var element = this.element,
                            matches = (element.getAttribute('style') || '').match(/[\s;]transition:\s*(.*);/),
                            callback = this.onTransitionEnd = function(event) {
                                if (event.propertyName === that.transition) {
                                    element.removeEventListener(fnCommon.withPrefix('transitionEnd'), callback);
                                    that._setTransition(that.before);
                                    that.queue.setTransition(that.transition, that.before);
                                    fnStyle.setStyle(element, that.name, that.result);
                                    that.success();
                                }
                            };

                        this.before = this._getTransition();
                        if (this.from === this.to) {
                            setTimeout(function() {
                                callback({propertyName: that.transition});
                            }, this.duration);
                        } else {
                            this._setTransition(this.transition + ' ' + this.duration + 'ms cubic-bezier(' + this.easing.join(',') + ') 0s');
                            fnStyle.setStyle(element, this.name, this.step(this.from, this.to, this.unit, 0));
                            element.addEventListener(fnCommon.withPrefix('transitionEnd'), callback);
                        }
                        setTimeout($.proxy(function() {
                            fnStyle.setStyle(element, this.name, this.result = this.step(this.from, this.to, this.unit, 1));
                        }, this), !$.browser().webkit * 30);
                    }

                    this.state = 1;
                },

                next: function() {
                    if ((this.time.progress = ($.time().getTime() - this.time.start) / this.duration) > 1) {
                        if (this.method === 1) {
                            fnStyle.setStyle(this.element, this.name, this.step(this.from, this.to, this.unit, 1));
                            this.success();
                        } else if (this.time.progress > coreConst.maxTransitionTime) {
                            this.error();
                        }
                    } else {
                        if (this.method === 1) fnStyle.setStyle(this.element, this.name, this.step(this.from, this.to, this.unit, this.easing(this.time.progress)));
                        $.isFunction(this.callback.onStep) && this.callback.onStep.call(this.element, this.time.progress, this);
                    }
                    return this;
                },

                error: function() {
                    if (this.method === 0) {
                        var element = this.element;
                        element.removeEventListener(fnCommon.withPrefix('transitionEnd'), this.onTransitionEnd);

                        if (this.transition.indexOf('transform') === -1 || this.time.progress >= 1) {
                            fnStyle.setStyle(element, this.name, fnStyle.getStyle(element, this.name));
                        } else {
                            var jsEasing = coreData.easing.js[options.easingName] || coreData.easing.js.linear;
                            fnStyle.setStyle(element, this.name, this.step(this.from, this.to, this.unit, jsEasing(this.time.progress)));
                        }
                        this._setTransition(this.before);
                    }
                    $.isFunction(this.callback.onError) && this.callback.onError();
                    return this.finish();
                },

                success: function() {
                    $.isFunction(this.callback.onSuccess) && this.callback.onSuccess();
                    return this.finish();
                },

                finish: function() {
                    $.isFunction(this.callback.onComplete) && this.callback.onComplete();
                    this.state = 2;
                    this.queue.remove(this.name);
                    return this;
                }
            },
            Fly: {
                __constructor: function() {
                    coreConst.map.unescape = this.invert(coreConst.map.escape);
                    coreConst.regex.escape = new RegExp('[' + this.keys(coreConst.map.escape).join('') + ']', 'g');
                    coreConst.regex.unescape = new RegExp('(' + this.keys(coreConst.map.unescape).join('|') + ')', 'g');

                    var color = 'transparent';
                    for (var c in coreConst.map.color) {
                        color += '|' + c;
                    }
                    coreConst.regex.color.unshift(new RegExp('^\\s*(' + color + ')$', 'i'));

                    var oneSizeMap = coreConst.map.property.one;
                    for (var p in {Width: 0, Height: 0}) {
                        oneSizeMap.push(p.toLowerCase(), 'min' + p, 'max' + p);
                    }
                    var v = {Top: 0, Bottom: 0},
                        h = {Right: 0, Left: 0},
                        addProperty = function(p) {
                            oneSizeMap.push(p.toLowerCase(), 'margin' + p, 'padding' + p, 'border' + p + 'Width');
                        };
                    for (var pv in v) {
                        addProperty(pv);
                        for (var ph in h) {
                            addProperty(ph);
                            oneSizeMap.push('border' + v[pv] + h[ph] + 'Radius');
                        }
                    }

                    coreGlobal.detectPpi();
                    coreGlobal.detectBrowser();
                    coreGlobal.setRequestAnimationFrame();

                    document.addEventListener('DOMContentLoaded', function() {
                        coreConst.ready = true;
                        var ready = coreData.ready;
                        for (var r = 0, rl = ready.length; r < rl; r++) {
                            ready[r]();
                        }
                        delete coreData.ready;
                    }, false);
                },

                inherit: function() {
                    return fnWrapper.inherit.apply(this, arguments);
                },

                new: function(html) {
                    var span = document.createElement('span');
                        span.innerHTML = html;
                    return new FlyDomNode(span.childNodes);
                },

                paste: function(key) {
                    var result = coreData.dom[key];
                    $.delete(key, true);
                    return result;
                },

                delete: function(key, __isPaste) {
                    if (__isPaste !== true) {
                        var nodes = coreData.dom[key] || [];
                        for (var n = 0, nl = nodes.length; n < nl; n++) {
                            var node = nodes[n];
                            if (!document.contains(node)) fnWrapper.unsubNode(node, true, true);
                        }
                    }
                    delete coreData.dom[key];
                    return this;
                },

                browser: function() {
                    return coreConst.browser;
                },

                each: function(object, callback, context) {
                    if ($.isArray(object) || $.isNodeList(object) || object instanceof FlyDomNode) {
                        for (var o = 0, ol = object.length; o < ol; o++) {
                            var item = object[o];
                            if (callback.call(context || item, item, o, object) === false) break;
                        }
                    } else {
                        for (var o in object) {
                            var item = object[o];
                            if (object.hasOwnProperty(o) && callback.call(context || item, item, o, object) === false) break;
                        }
                    }
                    return this;
                },

                map: function(object, callback, context) {
                    var result = [];
                    $.each(object, function(element, index) {
                        var value = callback.call(context || element, element, index, object);
                        if (value !== null) result.push(value);
                    });
                    return result;
                },

                grep: function(object, callback, invert, context) {
                    var result = [];
                    if (!$.isBoolean(invert)) {
                        context = invert;
                        invert = false;
                    }
                    $.each(object, function(element, index) {
                        var value = callback.call(context || element, element, index, object);
                        if (invert) value = !value;
                        if (value) result.push(element);
                    });
                    return result;
                },

                indexesOf: function(object, value) {
                    var result = [];
                    if ($.isArray(object)) {
                        for (var o = 0, ol = object.length; o < ol; o++) {
                            if (object[o] === value) result.push(o);
                        }
                    } else {
                        for (var o in object) {
                            if (object.hasOwnProperty(o) && object[o] === value) result.push(o);
                        }
                    }
                    return result;
                },

                indexOf: function(object, element) {
                    if ($.isArray(object)) {
                        return object.indexOf(element);
                    } else {
                        for (var o in object) {
                            if (object.hasOwnProperty(o) && object[o] === element) return o;
                        }
                        return -1;
                    }
                },

                pad: function(source, length, addition, side) {
                    source += '';
                    addition = addition === undefined ? ' ' : addition + '';
                    var string = '',
                        sl = source.length,
                        al = addition.length,
                        time = ((length - sl) / al) ^ 0;
                    for (var t = 0; t < time; t++) {
                        string += addition;
                    }
                    string += addition.substr(0, length - sl - string.length);
                    return side === 1 ? source + string : string + source;
                },

                trim: function(string, side) {
                    string += '';
                    if (side === -1) {
                        return string.replace(/^\s+/, '');
                    } else if (side === 1) {
                        return string.replace(/\s+$/, '');
                    } else {
                        return string.trim();
                    }
                },

                unique: function(array) {
                    var result = [];
                    for (var a = 0, al = array.length; a < al; a++) {
                        var value = array[a];
                        if (result.indexOf(value) === -1) result.push(value);
                    }
                    return result;
                },

                proxy: function(callback, context) {
                    return function() {
                        callback.apply(context || window, arguments);
                    };
                },

                memoize: function(callback, hasher, context) {
                    var storage = {};
                    if (!$.isFunction(hasher)) {
                        context = hasher;
                        hasher = function(value) {return value};
                    }
                    context = context || window;
                    return function() {
                        var key = hasher.apply(this, arguments);
                        return storage.hasOwnProperty(key) ? storage[key] : (storage[key] = callback.apply(context, arguments));
                    };
                },

                time: function(value) {
                    return arguments.length === 0 ? (new Date()) : (new Date(value));
                },

                merge: function() {
                    var array = [];
                    return array.concat.apply(array, arguments);
                },

                union: function() {
                    return $.unique($.merge.apply($, arguments));
                },

                without: function(array) {
                    return $.difference(array, [].slice.call(arguments, 1));
                },

                intersection: function(array) {
                    array = $.unique(array);
                    var result = [],
                        al = array.length,
                        vl = arguments.length;
                    for (var a = 0; a < al; a++) {
                        var valid = true,
                            value = array[a];
                        for (var v = 1; v < vl; v++) {
                            if (arguments[v].indexOf(value) === -1) {
                                valid = false;
                                break;
                            }
                        }
                        if (valid) result.push(value);
                    }
                    return result;
                },

                difference: function(array) {
                    var values = $.merge.apply(this, [].slice.call(arguments, 1)),
                        result = [];
                    for (var a = 0, al = array.length; a < al; a++) {
                        var value = array[a];
                        if (values.indexOf(value) === -1) result.push(value);
                    }
                    return result;
                },

                extend: function(target) {
                    var deep = false,
                        options,
                        clone,
                        i = 1;

                    if ($.isBoolean(target)) {
                        deep = target;
                        target = arguments[1];
                        i = 2;
                    }

                    if (!$.isObject(target) && !$.isFunction(target)) target = {};

                    for (var o = i, ol = arguments.length; o < ol; o++) {
                        if ((options = arguments[o]) !== null) {
                            for (var name in options) {
                                var source = target[name],
                                    copy = options[name],
                                    isCopyArray;

                                if (target === copy) continue;
                                if (deep && copy && ($.isPlainObject(copy) || (isCopyArray = $.isArray(copy)))) {
                                    if (isCopyArray) {
                                        clone = source && $.isArray(source) ? source : [];
                                    } else {
                                        clone = source && $.isPlainObject(source) ? source : {};
                                    }

                                    target[name] = $.extend(deep, clone, copy);
                                } else if (copy !== undefined) {
                                    target[name] = copy;
                                }
                            }
                        }
                    }

                    return target;
                },

                ajax: function() {
                    var dPreset = corePreset.default.ajax,
                        gPreset = corePreset.user.ajax.global || {},
                        ePreset = corePreset.empty.ajax,
                        options = $.extend(true, {}, dPreset, gPreset, ePreset),
                        array = arguments;

                    if ($.isArray(array[0])) array = array[0];
                    for (var a = 0, al = array.length; a < al; a++) {
                        var item = array[a];
                        if ($.isString(item)) item = corePreset.user.ajax[item];
                        $.extend(true, options, item);
                    }

                    if (!options.status) options.status = {};

                    if (options.data instanceof FlyDomNode && options.data.tag() === 'form') options.data = options.data.get(0);
                    if ($.isNode(options.data) && options.data.tagName.toLowerCase() === 'form') {
                        options.data = new FormData(options.data);
                        options.encoding = false;
                        options.method = 'POST';
                    }

                    if (options.parser === 'jsonp') {
                        options.method = 'GET';
                        options.encoding = dPreset.encoding;
                        options.data.callback = 'Fly' + (Math.random() + '').slice(2);
                    } else {
                        options.method = options.method.toUpperCase();
                        options.cache = $.isBoolean(options.cache) ? (options.cache ? 'public' : 'no-cache') : options.cache;
                    }

                    options.body = '';
                    var params = [];
                    if (options.encoding === 'application/x-www-form-urlencoded') {
                        if (!$.isString(options.data)) {
                            for (var d in options.data) {
                                if (options.data.hasOwnProperty(d)) params.push(d + '=' + window.encodeURIComponent(options.data[d]));
                            }
                            params = params.join('&');
                        } else {
                            params = options.data;
                        }
                        header('Content-Type', options.encoding + '; charset=UTF-8');
                    } else if (options.encoding === 'multipart/form-data') {
                        var boundary = 'FlY' + (Math.random() + '').substr(2) + 'yLf';
                        for (var d in options.data) {
                            if (options.data.hasOwnProperty(d)) params.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + d + '"\r\n\r\n' + options.data[d] + '\r\n');
                        }
                        params = params.join('') + '--' + boundary + '--';
                        header('Content-Type', options.encoding + '; boundary=' + boundary);
                    } else {
                        params = options.data;
                    }

                    if (options.method === 'POST') {
                        options.body = params;
                    } else {
                        options.url += '?' + params;
                    }

                    if (options.parser === 'jsonp') {
                        window[options.data.callback] = function() {
                            exec = true;
                            complete(null, {url: options.url, status: 200, response: [].slice.call(arguments)});
                        };

                        var exec = false,
                            script = document.createElement('script');

                        script.onload = script.onerror = function() {
                            delete window[options.data.callback];
                            !exec && complete('error', {url: options.url, status: 0, response: []});
                        };
                        script.src = options.url;

                        document.head.appendChild(script);
                    } else {
                        var xhr = options.xhr.call(options.context);
                        xhr.open(options.method, options.url, !!options.async, options.user, options.password);

                        xhr.timeout = +options.timeout;
                        header('Cache-Control', options.cache);
                        header('X-Requested-With', 'XMLHttpRequest');
                        options.mime && xhr.overrideMimeType(options.mime);
                        for (var h in options.headers) {
                            if (options.headers.hasOwnProperty(h)) xhr.setRequestHeader(h, options.headers[h]);
                        }

                        xhr.onload = function() {
                            complete(null, xhr);
                        }

                        xhr.onprogress = function(event) {
                            options.global && call(gPreset.progress, gPreset.context, event, xhr);
                            call(options.progress, options.context, event, xhr);
                        }

                        if (xhr.upload) xhr.upload.onprogress = function(event) {
                            options.global && call(gPreset.upload, gPreset.context, event, xhr);
                            call(options.upload, options.context, event, xhr);
                        }

                        var errorList = ['error', 'abort'],
                            timer;
                        if ($.browser().webkit) {
                            if (options.timeout > 0) timer = setTimeout(function() {
                                xhr.onabort = null;
                                xhr.abort();
                                complete('timeout', xhr);
                            }, options.timeout);
                        } else {
                            errorList.push('timeout');
                        }
                        this.each(errorList, function(item) {
                            xhr['on' + item] = function() {
                                complete(item, xhr);
                            };
                        });

                        options.global && call(gPreset.before, gPreset.context, xhr);
                        call(options.before, options.context, xhr);
                        xhr.send(options.body);
                    }

                    function header(name, value) {
                        if (!options.headers[name]) options.headers[name] = value;
                    }

                    function call(something) {
                        if ($.isFunction(something)) {
                            something.apply(arguments[1], [].slice.call(arguments, 2));
                        }
                    }

                    function complete(error, xhr) {
                        clearTimeout(timer);
                        if (error === null) {
                            var result;
                            switch (options.parser) {
                                case 'json':
                                    try {
                                        result = JSON.parse(xhr.responseText);
                                    } catch(e) {
                                        complete('parseerror', xhr);
                                        return;
                                    }
                                    break;
                                case 'xml':
                                    result = xhr.responseXML;
                                    break;
                                case 'jsonp':
                                    result = xhr.response;
                                    break;
                                case 'script':
                                    try {
                                        (new Function(xhr.responseText)).call(options.context);
                                    } catch(e) {}
                                default:
                                    result = xhr.responseText;
                            }

                            options.global && call(gPreset.success, gPreset.context, result, xhr.status, xhr);
                            call(options.success, options.context, result, xhr.status, xhr);
                            options.global && gPreset.status && call(gPreset.status[xhr.status], gPreset.context, result, xhr.status, xhr);
                            call(options.status[xhr.status], options.context, result, xhr.status, xhr);
                        } else {
                            options.global && call(gPreset.error, gPreset.context, xhr, error);
                            call(options.error, options.context, xhr, error);
                        }
                        options.global && call(gPreset.complete, gPreset.context, error, xhr, xhr.status);
                        call(options.complete, options.context, error, xhr, xhr.status);
                    }

                    return this;
                },

                eq: function(object, index) {
                    if (index < 0 && $.isNumber(index)) index += object.length;
                    return object[index];
                },

                random: function(a, b) {
                    if (b === undefined) b = 0;
                    var min = Math.ceil(Math.min(a, b)),
                        max = Math.floor(Math.max(a, b));
                    return isNaN(min) || isNaN(max) ? null : Math.floor(min + Math.random() * (1 + max - min));
                },

                pluck: function(array, property) {
                    var result = [];
                    for (var a = 0, al = array.length; a < al; a++) {
                        result.push(array[a][property]);
                    }
                    return result;
                },

                shuffle: function(object) {
                    var index = 0,
                        result = [];
                    $.each(object, function(value) {
                        var random = $.random(index++);
                        result[index - 1] = result[random];
                        result[random] = value;
                    });
                    return result;
                },

                size: function(object) {
                    var result = 0,
                        type = typeof object;
                    if (type === 'object' || type === 'function') {
                        result = object.length >= 0 ? object.length : Object.keys(object).length;
                    } else if (type === 'string' || type === 'number') {
                        result = (object + '').length;
                    }
                    return result;
                },

                sign: function(x) {
                    return x ? x < 0 ? -1 : 1 : 0;
                },

                factorial: function(x) {
                    x = parseInt(x);
                    return (x <= 1) ? (x < 0 ? null : 1) : x * $.factorial(x - 1);
                },

                range: function(from, to) {
                    var from = from * 1,
                        to = to * 1,
                        diff = to - from,
                        step = (diff > 0) * 2 - 1;
                    if (isNaN(from) || isNaN(to)) {
                        return null;
                    } else {
                        var result = [];
                        for (var r = step > 0 ? Math.ceil(from) : Math.floor(from); r * step <= to * step; r += step) {
                            result.push(r);
                        }
                        return result;
                    }
                },

                sample: function(array, n) {
                    return $.isNumber(n) ? $.shuffle(array).slice(0, Math.max(0, n)) : array[$.random(array.length - 1)];
                },

                invert: function(object) {
                    if (!(object instanceof Object)) return null;
                    var result = {},
                        keys = Object.keys(object);
                    for (var k = 0, kl = keys.length; k < kl; k++) {
                        var key = keys[k];
                        result[object[key]] = key;
                    }
                    return result;
                },

                keys: function(object) {
                    return object instanceof Object ? Object.keys(object) : null;
                },

                values: function(object) {
                    var result = [],
                        keys = Object.keys(object);
                    for (var k = 0, kl = keys.length; k < kl; k++) {
                        result[k] = object[keys[k]];
                    }
                    return result;
                },

                toArray: function(object) {
                    if (Array.isArray(object)) {
                        return [].slice.call(object);
                    } else {
                        if (object.length === +object.length) {
                            return $.map(object, function(item) {
                                return item;
                            });
                        } else {
                            return $.values(object);
                        }
                    }
                },

                sortBy: function(object, value, context) {
                    var iterator = $.isFunction(value) ? value : function(o) {return o === null || o === undefined ? null : o[value]};
                    return $.pluck($.map(object, function(value, index, list) {
                        return {
                            value: value,
                            index: index,
                            order: iterator.call(context, value, index, list)
                        };
                    }).sort(function(left, right) {
                        var a = left.order,
                            b = right.order;
                        return a === b ? left.index - right.index : (a > b || a === undefined ? 1 : -1);
                    }), 'value');
                },

                breakFlow: function(callback, context) {
                    setTimeout(function() {
                        callback.apply(context || window, arguments);
                    }, 0);
                    return this;
                },

                cookie: function(name, value, options) {
                    if (arguments.length === 1) {
                        var re = new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'),
                        matches = document.cookie.match(re);
                        return matches ? window.decodeURIComponent(matches[1]) : undefined;
                    } else if (value === null || value === false) {
                        return $.cookie(name, '', {expires: -1});
                    } else {
                        if (!$.isObject(options)) options = {};
                        value = window.encodeURIComponent(value);

                        var expires = parseFloat(options.expires);
                        switch(options.expires) {
                            case expires + 'd': expires *= 86400000; break;
                            case expires + 'h': expires *= 3600000; break;
                            case expires + 'm': expires *= 60000; break;
                            default: expires *= 1000;
                        }

                        if (!isNaN(expires)) expires = options.expires = (new Date($.time().getTime() + expires)).toUTCString();

                        var cookie = name + '=' + value;
                        for (var o in options) {
                            cookie += '; ' + o;
                            var property = options[o];
                            if (property !== true) cookie += '=' + property;
                        }

                        document.cookie = cookie;
                        return this;
                    }
                },

                selection: function(content, dom) {
                    if (content === null || dom === null) {
                        window.getSelection().removeAllRanges();
                        return this;
                    } else if (($.isBoolean(content) && arguments.length === 1) || arguments.length === 0) {
                        var result = window.getSelection();
                        return content ? result.toString() : result;
                    } else {
                        var nodes = fnNodeList.makeDomNodeArray(arguments[$.isBoolean(content) ? 1 : 0]),
                        selection = window.getSelection();

                        selection.removeAllRanges();
                        if (content === true) {
                            selection.selectAllChildren(nodes[0]);
                        } else {
                            for (var n = 0, nl = nodes.length; n < nl; n++) {
                                var range = document.createRange();
                                range.selectNode(nodes[n]);
                                selection.addRange(range);
                            }
                        }
                        return this;
                    }
                },

                isWindow: function(value) {
                    return value === window;
                },

                isNode: function(value) {
                    var type = coreConst.protobject.toString.call(value);
                    return type !== '[object HTMLCollection]' && type === '[object Text]' || type.indexOf('[object HTML') === 0;
                },

                isNodeList: function(value) {
                    var type = coreConst.protobject.toString.call(value);
                    return type === '[object NodeList]' || type === '[object HTMLCollection]';
                },

                isPlainObject: function(object) {
                    var toString = coreConst.protobject.toString,
                        hasOwn = coreConst.protobject.hasOwnProperty;

                    if (!object || !$.isObject(object) || $.isNode(object) || object === window) return false;
                    if (object.constructor && !hasOwn.call(object, 'constructor') && !hasOwn.call(object.constructor.prototype, 'isPrototypeOf')) return false;

                    for (var k in object) {};
                    return k === undefined || hasOwn.call(object, k);
                },

                ready: function(handler, context) {
                    if (coreConst.ready) {
                        handler.call(context);
                    } else {
                        coreData.ready.push($.proxy(handler, context || window));
                    }
                    return this;
                },

                noop: function() {

                }
            }
        };

    coreGlobal.generateHooks();
    coreGlobal.generateMethods();
    coreGlobal.generateConstructors();

    var $ = coreConstructor.Fly,
        FlyNode = fnWrapper.inherit(Array, coreConstructor.FlyNode),
        FlyDomNode = fnWrapper.inherit(FlyNode, coreConstructor.FlyDomNode),
        FlyDomQueue = fnWrapper.inherit(coreConstructor.FlyDomQueue),
        FlyDomTween = fnWrapper.inherit(coreConstructor.FlyDomTween),
        Fly = function(query, context) {return fnNodeList.getFlyDomNode(query, context)};

    window.$ = $ = $.extend(Fly, $);
    Fly.__constructor();
})(window, document, void(0));
