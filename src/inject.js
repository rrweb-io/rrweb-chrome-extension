var record = (function() {
  "use strict";

  /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

  var __assign = function() {
    __assign =
      Object.assign ||
      function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };

  var NodeType;
  (function(NodeType) {
    NodeType[(NodeType["Document"] = 0)] = "Document";
    NodeType[(NodeType["DocumentType"] = 1)] = "DocumentType";
    NodeType[(NodeType["Element"] = 2)] = "Element";
    NodeType[(NodeType["Text"] = 3)] = "Text";
    NodeType[(NodeType["CDATA"] = 4)] = "CDATA";
    NodeType[(NodeType["Comment"] = 5)] = "Comment";
  })(NodeType || (NodeType = {}));

  var _id = 1;
  function genId() {
    return _id++;
  }
  function resetId() {
    _id = 1;
  }
  function getCssRulesString(s) {
    try {
      var rules = s.rules || s.cssRules;
      return rules
        ? Array.from(rules).reduce(function(prev, cur) {
            return (prev += cur.cssText);
          }, "")
        : null;
    } catch (error) {
      return null;
    }
  }
  function extractOrigin(url) {
    var origin;
    if (url.indexOf("//") > -1) {
      origin = url
        .split("/")
        .slice(0, 3)
        .join("/");
    } else {
      origin = url.split("/")[0];
    }
    origin = origin.split("?")[0];
    return origin;
  }
  var URL_IN_CSS_REF = /url\((['"])([^'"]*)\1\)/gm;
  function absoluteToStylesheet(cssText, href) {
    return cssText.replace(URL_IN_CSS_REF, function(_1, _2, filePath) {
      if (!/^[./]/.test(filePath)) {
        return "url('" + filePath + "')";
      }
      if (filePath[0] === "/") {
        return "url('" + (extractOrigin(href) + filePath) + "')";
      }
      var stack = href.split("/");
      var parts = filePath.split("/");
      stack.pop();
      for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        if (part === ".") {
          continue;
        } else if (part === "..") {
          stack.pop();
        } else {
          stack.push(part);
        }
      }
      return "url('" + stack.join("/") + "')";
    });
  }
  var RELATIVE_PATH = /^(\.\.|\.|)\//;
  function absoluteToDoc(doc, attributeValue) {
    if (!RELATIVE_PATH.test(attributeValue)) {
      return attributeValue;
    }
    var a = doc.createElement("a");
    a.href = attributeValue;
    return a.href;
  }
  function isSVGElement(el) {
    return el.tagName === "svg" || el instanceof SVGElement;
  }
  function serializeNode(n, doc) {
    switch (n.nodeType) {
      case n.DOCUMENT_NODE:
        return {
          type: NodeType.Document,
          childNodes: []
        };
      case n.DOCUMENT_TYPE_NODE:
        return {
          type: NodeType.DocumentType,
          name: n.name,
          publicId: n.publicId,
          systemId: n.systemId
        };
      case n.ELEMENT_NODE:
        var tagName = n.tagName.toLowerCase();
        var attributes_1 = {};
        for (var _i = 0, _a = Array.from(n.attributes); _i < _a.length; _i++) {
          var _b = _a[_i],
            name = _b.name,
            value = _b.value;
          if (name === "src" || name === "href") {
            attributes_1[name] = absoluteToDoc(doc, value);
          } else {
            attributes_1[name] = value;
          }
        }
        if (tagName === "link") {
          var stylesheet = Array.from(doc.styleSheets).find(function(s) {
            return s.href === n.href;
          });
          var cssText = getCssRulesString(stylesheet);
          if (cssText) {
            attributes_1 = {
              _cssText: absoluteToStylesheet(cssText, stylesheet.href)
            };
          }
        }
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select"
        ) {
          var value = n.value;
          if (
            attributes_1.type !== "radio" &&
            attributes_1.type !== "checkbox" &&
            value
          ) {
            attributes_1.value = value;
          } else if (n.checked) {
            attributes_1.checked = n.checked;
          }
        }
        if (tagName === "option") {
          var selectValue = n.parentElement;
          if (attributes_1.value === selectValue.value) {
            attributes_1.selected = n.selected;
          }
        }
        return {
          type: NodeType.Element,
          tagName: tagName,
          attributes: attributes_1,
          childNodes: [],
          isSVG: isSVGElement(n) || undefined
        };
      case n.TEXT_NODE:
        var parentTagName = n.parentNode && n.parentNode.tagName;
        var textContent = n.textContent;
        if (parentTagName === "SCRIPT") {
          textContent = "SCRIPT_PLACEHOLDER";
        }
        return {
          type: NodeType.Text,
          textContent: textContent || "",
          isStyle: parentTagName === "STYLE" ? true : undefined
        };
      case n.CDATA_SECTION_NODE:
        return {
          type: NodeType.CDATA,
          textContent: ""
        };
      case n.COMMENT_NODE:
        return {
          type: NodeType.Comment,
          textContent: n.textContent || ""
        };
      default:
        return false;
    }
  }
  function serializeNodeWithId(n, doc, map, skipChild) {
    if (skipChild === void 0) {
      skipChild = false;
    }
    var _serializedNode = serializeNode(n, doc);
    if (!_serializedNode) {
      console.warn(n, "not serialized");
      return null;
    }
    var serializedNode = Object.assign(_serializedNode, {
      id: genId()
    });
    n.__sn = serializedNode;
    map[serializedNode.id] = n;
    if (
      (serializedNode.type === NodeType.Document ||
        serializedNode.type === NodeType.Element) &&
      !skipChild
    ) {
      for (var _i = 0, _a = Array.from(n.childNodes); _i < _a.length; _i++) {
        var childN = _a[_i];
        var serializedChildNode = serializeNodeWithId(childN, doc, map);
        if (serializedChildNode) {
          serializedNode.childNodes.push(serializedChildNode);
        }
      }
    }
    return serializedNode;
  }
  function snapshot(n) {
    resetId();
    var idNodeMap = {};
    return [serializeNodeWithId(n, n, idNodeMap), idNodeMap];
  }

  function on(type, fn, target) {
    if (target === void 0) {
      target = document;
    }
    target.addEventListener(type, fn, { capture: true, passive: true });
    return function() {
      return target.removeEventListener(type, fn);
    };
  }
  var mirror = {
    map: {},
    getId: function(n) {
      if (!n.__sn) {
        return -1;
      }
      return n.__sn.id;
    },
    getNode: function(id) {
      return mirror.map[id] || null;
    },
    removeNodeFromMap: function(n) {
      var id = n.__sn && n.__sn.id;
      delete mirror.map[id];
      if (n.childNodes) {
        n.childNodes.forEach(function(child) {
          return mirror.removeNodeFromMap(child);
        });
      }
    },
    has: function(id) {
      return mirror.map.hasOwnProperty(id);
    }
  };
  function throttle(func, wait, options) {
    if (options === void 0) {
      options = {};
    }
    var timeout = null;
    var previous = 0;
    return function() {
      var now = Date.now();
      if (!previous && options.leading === false) {
        previous = now;
      }
      var remaining = wait - (now - previous);
      var context = this;
      var args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          window.clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = window.setTimeout(function() {
          previous = options.leading === false ? 0 : Date.now();
          timeout = null;
          func.apply(context, args);
        }, remaining);
      }
    };
  }
  function hookSetter(target, key, d) {
    var original = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, {
      set: function(value) {
        var _this = this;
        setTimeout(function() {
          d.set.call(_this, value);
        }, 0);
        if (original && original.set) {
          original.set.call(this, value);
        }
      }
    });
    return function() {
      return hookSetter(target, key, original || {});
    };
  }
  function getWindowHeight() {
    return (
      window.innerHeight ||
      (document.documentElement && document.documentElement.clientHeight) ||
      (document.body && document.body.clientHeight)
    );
  }
  function getWindowWidth() {
    return (
      window.innerWidth ||
      (document.documentElement && document.documentElement.clientWidth) ||
      (document.body && document.body.clientWidth)
    );
  }

  var EventType;
  (function(EventType) {
    EventType[(EventType["DomContentLoaded"] = 0)] = "DomContentLoaded";
    EventType[(EventType["Load"] = 1)] = "Load";
    EventType[(EventType["FullSnapshot"] = 2)] = "FullSnapshot";
    EventType[(EventType["IncrementalSnapshot"] = 3)] = "IncrementalSnapshot";
    EventType[(EventType["Meta"] = 4)] = "Meta";
  })(EventType || (EventType = {}));
  var IncrementalSource;
  (function(IncrementalSource) {
    IncrementalSource[(IncrementalSource["Mutation"] = 0)] = "Mutation";
    IncrementalSource[(IncrementalSource["MouseMove"] = 1)] = "MouseMove";
    IncrementalSource[(IncrementalSource["MouseInteraction"] = 2)] =
      "MouseInteraction";
    IncrementalSource[(IncrementalSource["Scroll"] = 3)] = "Scroll";
    IncrementalSource[(IncrementalSource["ViewportResize"] = 4)] =
      "ViewportResize";
    IncrementalSource[(IncrementalSource["Input"] = 5)] = "Input";
  })(IncrementalSource || (IncrementalSource = {}));
  var MouseInteractions;
  (function(MouseInteractions) {
    MouseInteractions[(MouseInteractions["MouseUp"] = 0)] = "MouseUp";
    MouseInteractions[(MouseInteractions["MouseDown"] = 1)] = "MouseDown";
    MouseInteractions[(MouseInteractions["Click"] = 2)] = "Click";
    MouseInteractions[(MouseInteractions["ContextMenu"] = 3)] = "ContextMenu";
    MouseInteractions[(MouseInteractions["DblClick"] = 4)] = "DblClick";
    MouseInteractions[(MouseInteractions["Focus"] = 5)] = "Focus";
    MouseInteractions[(MouseInteractions["Blur"] = 6)] = "Blur";
    MouseInteractions[(MouseInteractions["TouchStart"] = 7)] = "TouchStart";
    MouseInteractions[(MouseInteractions["TouchMove"] = 8)] = "TouchMove";
    MouseInteractions[(MouseInteractions["TouchEnd"] = 9)] = "TouchEnd";
  })(MouseInteractions || (MouseInteractions = {}));

  function initMutationObserver(cb) {
    var observer = new MutationObserver(function(mutations) {
      var texts = [];
      var attributes = [];
      var removes = [];
      var adds = [];
      var dropped = [];
      var addsSet = new Set();
      var genAdds = function(n) {
        addsSet.add(n);
        n.childNodes.forEach(function(childN) {
          return genAdds(childN);
        });
      };
      mutations.forEach(function(mutation) {
        var type = mutation.type,
          target = mutation.target,
          oldValue = mutation.oldValue,
          addedNodes = mutation.addedNodes,
          removedNodes = mutation.removedNodes,
          attributeName = mutation.attributeName;
        switch (type) {
          case "characterData": {
            var value = target.textContent;
            if (value !== oldValue) {
              texts.push({
                value: value,
                node: target
              });
            }
            break;
          }
          case "attributes": {
            var value = target.getAttribute(attributeName);
            if (value === oldValue) {
              return;
            }
            var item = attributes.find(function(a) {
              return a.node === target;
            });
            if (!item) {
              item = {
                node: target,
                attributes: {}
              };
              attributes.push(item);
            }
            item.attributes[attributeName] = value;
          }
          case "childList": {
            addedNodes.forEach(function(n) {
              return genAdds(n);
            });
            removedNodes.forEach(function(n) {
              if (addsSet.has(n)) {
                addsSet["delete"](n);
                dropped.push(n);
              } else if (addsSet.has(target) && !mirror.getId(n));
              else {
                removes.push({
                  parentId: mirror.getId(target),
                  id: mirror.getId(n)
                });
              }
              mirror.removeNodeFromMap(n);
            });
            break;
          }
          default:
            break;
        }
      });
      removes = removes.map(function(remove) {
        if (remove.parentNode) {
          remove.parentId = mirror.getId(remove.parentNode);
          delete remove.parentNode;
        }
        return remove;
      });
      Array.from(addsSet).forEach(function(n) {
        var parentId = mirror.getId(n.parentNode);
        if (
          parentId &&
          !dropped.some(function(d) {
            return d === n.parentNode;
          }) &&
          !removes.some(function(r) {
            return r.id === parentId;
          })
        ) {
          adds.push({
            parentId: mirror.getId(n.parentNode),
            previousId: !n.previousSibling
              ? n.previousSibling
              : mirror.getId(n.previousSibling),
            nextId: !n.nextSibling
              ? n.nextSibling
              : mirror.getId(n.nextSibling),
            node: serializeNodeWithId(n, document, mirror.map, true)
          });
        } else {
          dropped.push(n);
        }
      });
      cb({
        texts: texts
          .map(function(text) {
            return {
              id: mirror.getId(text.node),
              value: text.value
            };
          })
          .filter(function(text) {
            return mirror.has(text.id);
          }),
        attributes: attributes
          .map(function(attribute) {
            return {
              id: mirror.getId(attribute.node),
              attributes: attribute.attributes
            };
          })
          .filter(function(attribute) {
            return mirror.has(attribute.id);
          }),
        removes: removes,
        adds: adds
      });
    });
    observer.observe(document, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true
    });
    return observer;
  }
  function initMousemoveObserver(cb) {
    var positions = [];
    var timeBaseline;
    var wrappedCb = throttle(function() {
      var totalOffset = Date.now() - timeBaseline;
      cb(
        positions.map(function(p) {
          p.timeOffset -= totalOffset;
          return p;
        })
      );
      positions = [];
      timeBaseline = null;
    }, 500);
    var updatePosition = throttle(
      function(evt) {
        var clientX = evt.clientX,
          clientY = evt.clientY,
          target = evt.target;
        if (!timeBaseline) {
          timeBaseline = Date.now();
        }
        positions.push({
          x: clientX,
          y: clientY,
          id: mirror.getId(target),
          timeOffset: Date.now() - timeBaseline
        });
        wrappedCb();
      },
      20,
      {
        trailing: false
      }
    );
    return on("mousemove", updatePosition);
  }
  function initMouseInteractionObserver(cb) {
    var handlers = [];
    var getHandler = function(eventKey) {
      return function(event) {
        var id = mirror.getId(event.target);
        var clientX = event.clientX,
          clientY = event.clientY;
        cb({
          type: MouseInteractions[eventKey],
          id: id,
          x: clientX,
          y: clientY
        });
      };
    };
    Object.keys(MouseInteractions)
      .filter(function(key) {
        return Number.isNaN(Number(key));
      })
      .forEach(function(eventKey) {
        var eventName = eventKey.toLowerCase();
        var handler = getHandler(eventKey);
        handlers.push(on(eventName, handler));
      });
    return function() {
      handlers.forEach(function(h) {
        return h();
      });
    };
  }
  function initScrollObserver(cb) {
    var updatePosition = throttle(function(evt) {
      if (!evt.target) {
        return;
      }
      var id = mirror.getId(evt.target);
      if (evt.target === document) {
        cb({
          id: id,
          x: document.documentElement.scrollLeft,
          y: document.documentElement.scrollTop
        });
      } else {
        cb({
          id: id,
          x: evt.target.scrollLeft,
          y: evt.target.scrollTop
        });
      }
    }, 100);
    return on("scroll", updatePosition);
  }
  function initViewportResizeObserver(cb) {
    var updateDimension = throttle(function() {
      var height = getWindowHeight();
      var width = getWindowWidth();
      cb({
        width: Number(width),
        height: Number(height)
      });
    }, 200);
    return on("resize", updateDimension, window);
  }
  var INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT"];
  var HOOK_PROPERTIES = [
    [HTMLInputElement.prototype, "value"],
    [HTMLInputElement.prototype, "checked"],
    [HTMLSelectElement.prototype, "value"],
    [HTMLTextAreaElement.prototype, "value"]
  ];
  var lastInputValueMap = new WeakMap();
  function initInputObserver(cb) {
    function eventHandler(event) {
      var target = event.target;
      if (
        !target ||
        !target.tagName ||
        INPUT_TAGS.indexOf(target.tagName) < 0
      ) {
        return;
      }
      var type = target.type;
      var text = target.value;
      var isChecked = false;
      if (type === "radio" || type === "checkbox") {
        isChecked = target.checked;
      }
      cbWithDedup(target, { text: text, isChecked: isChecked });
      var name = target.name;
      if (type === "radio" && name && isChecked) {
        document
          .querySelectorAll('input[type="radio"][name="' + name + '"]')
          .forEach(function(el) {
            if (el !== target) {
              cbWithDedup(el, {
                text: el.value,
                isChecked: !isChecked
              });
            }
          });
      }
    }
    function cbWithDedup(target, v) {
      var lastInputValue = lastInputValueMap.get(target);
      if (
        !lastInputValue ||
        lastInputValue.text !== v.text ||
        lastInputValue.isChecked !== v.isChecked
      ) {
        lastInputValueMap.set(target, v);
        var id = mirror.getId(target);
        cb(__assign({}, v, { id: id }));
      }
    }
    var handlers = ["input", "change"].map(function(eventName) {
      return on(eventName, eventHandler);
    });
    var propertyDescriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    );
    if (propertyDescriptor && propertyDescriptor.set) {
      handlers.push.apply(
        handlers,
        HOOK_PROPERTIES.map(function(p) {
          return hookSetter(p[0], p[1], {
            set: function() {
              eventHandler({ target: this });
            }
          });
        })
      );
    }
    return function() {
      handlers.forEach(function(h) {
        return h();
      });
    };
  }
  function initObservers(o) {
    var mutationObserver = initMutationObserver(o.mutationCb);
    var mousemoveHandler = initMousemoveObserver(o.mousemoveCb);
    var mouseInteractionHandler = initMouseInteractionObserver(
      o.mouseInteractionCb
    );
    var scrollHandler = initScrollObserver(o.scrollCb);
    var viewportResizeHandler = initViewportResizeObserver(o.viewportResizeCb);
    var inputHandler = initInputObserver(o.inputCb);
    return {
      mutationObserver: mutationObserver,
      mousemoveHandler: mousemoveHandler,
      mouseInteractionHandler: mouseInteractionHandler,
      scrollHandler: scrollHandler,
      viewportResizeHandler: viewportResizeHandler,
      inputHandler: inputHandler
    };
  }

  function wrapEvent(e) {
    return __assign({}, e, { timestamp: Date.now() });
  }
  function record(options) {
    if (options === void 0) {
      options = {};
    }
    var emit = options.emit;
    if (!emit) {
      throw new Error("emit function is required");
    }
    try {
      on("DOMContentLoaded", function() {
        emit(
          wrapEvent({
            type: EventType.DomContentLoaded,
            data: {}
          })
        );
      });
      var init_1 = function() {
        emit(
          wrapEvent({
            type: EventType.Meta,
            data: {
              href: window.location.href,
              width: getWindowWidth(),
              height: getWindowHeight()
            }
          })
        );
        var _a = snapshot(document),
          node = _a[0],
          idNodeMap = _a[1];
        if (!node) {
          return console.warn("Failed to snapshot the document");
        }
        mirror.map = idNodeMap;
        emit(
          wrapEvent({
            type: EventType.FullSnapshot,
            data: {
              node: node,
              initialOffset: {
                left: document.documentElement.scrollLeft,
                top: document.documentElement.scrollTop
              }
            }
          })
        );
        initObservers({
          mutationCb: function(m) {
            return emit(
              wrapEvent({
                type: EventType.IncrementalSnapshot,
                data: __assign({ source: IncrementalSource.Mutation }, m)
              })
            );
          },
          mousemoveCb: function(positions) {
            return emit(
              wrapEvent({
                type: EventType.IncrementalSnapshot,
                data: {
                  source: IncrementalSource.MouseMove,
                  positions: positions
                }
              })
            );
          },
          mouseInteractionCb: function(d) {
            return emit(
              wrapEvent({
                type: EventType.IncrementalSnapshot,
                data: __assign(
                  { source: IncrementalSource.MouseInteraction },
                  d
                )
              })
            );
          },
          scrollCb: function(p) {
            return emit(
              wrapEvent({
                type: EventType.IncrementalSnapshot,
                data: __assign({ source: IncrementalSource.Scroll }, p)
              })
            );
          },
          viewportResizeCb: function(d) {
            return emit(
              wrapEvent({
                type: EventType.IncrementalSnapshot,
                data: __assign({ source: IncrementalSource.ViewportResize }, d)
              })
            );
          },
          inputCb: function(v) {
            return emit(
              wrapEvent({
                type: EventType.IncrementalSnapshot,
                data: __assign({ source: IncrementalSource.Input }, v)
              })
            );
          }
        });
      };
      if (
        document.readyState === "interactive" ||
        document.readyState === "complete"
      ) {
        init_1();
      } else {
        on(
          "load",
          function() {
            emit(
              wrapEvent({
                type: EventType.Load,
                data: {}
              })
            );
            init_1();
          },
          window
        );
      }
    } catch (error) {
      console.warn(error);
    }
  }

  return record;
})();

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const sessionId = uuidv4();
let snapshots = [];

console.log("start recording");
record({
  emit: event => {
    event.sessionId = sessionId;
    snapshots.push(event);
  }
});

function save() {
  const body = JSON.stringify({
    events: snapshots
  });
  snapshots = [];
  fetch("http://192.168.17.205:9090/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });
}
setInterval(save, 5 * 1000);
window.addEventListener('beforeunload', save);
