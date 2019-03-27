"use babel";

import { CompositeDisposable } from "atom";

function isDescendantOfType(parentType, child) {
  var node = child.parentNode;
  while (node != null) {
    if (node.localName == parentType) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function getListener(options) {
  let mainAxis =
    options.direction == "left" || options.direction == "right" ? "X" : "Y";
  let crossAxis = mainAxis == "X" ? "Y" : "X";
  let reversed = options.direction == "right" || options.direction == "down";
  let keyboard = options.modifierKey;
  let previousScroll = 0;
  let timeout;
  return function(e) {
    if (keyboard == null || keyboard == "none") {
      if (
        Math.abs(e["delta" + mainAxis]) < Math.abs(e["delta" + crossAxis]) ||
        !isDescendantOfType("atom-text-editor", e.target)
      ) {
        return;
      }
    } else {
      if (
        Math.abs(e["delta" + mainAxis]) < Math.abs(e["delta" + crossAxis]) ||
        !e[keyboard] ||
        !isDescendantOfType("atom-text-editor", e.target)
      ) {
        return;
      }
    }
    e.preventDefault();
    e.stopImmediatePropagation();

    previousScroll += e["delta" + mainAxis];
    clearTimeout(timeout);
    timeout = setTimeout(() => (previousScroll = 0), 50);

    if (previousScroll > 50) {
      previousScroll -= 50;
      let editor;
      if ((editor = atom.workspace.getActiveTextEditor())) {
        editor[reversed ? "redo" : "undo"]();
      }
    } else if (previousScroll < -50) {
      previousScroll += 50;
      let editor;
      if ((editor = atom.workspace.getActiveTextEditor())) {
        editor[reversed ? "undo" : "redo"]();
      }
    }
  };
}

export default {
  config: {
    autoToggle: {
      title: "Auto Toggle",
      description: "Enabled on Atom startup.",
      type: "boolean",
      default: true
    },
    direction: {
      title: "Scroll direction",
      description:
        "Set the scroll direction action. Must be up/down on devices without touchpad or sidescroll.",
      type: "string",
      default: "left",
      enum: [
        {
          value: "left",
          description: "Scroll left to undo, right to redo"
        },
        {
          value: "right",
          description: "Scroll right to undo, left to redo"
        },
        {
          value: "up",
          description: "Scroll up to undo, down to redo"
        },
        {
          value: "down",
          description: "Scroll down to undo, up to redo"
        }
      ]
    },
    modifierKey: {
      title: "Keyboard Modifier",
      description: "Enable support for a keyboard modifier key + scroll.",
      type: "string",
      default: "none",
      enum: [
        {
          value: "none",
          description: "No modifier key used"
        },
        {
          value: "altKey",
          description: "Alt (Option) key"
        },
        {
          value: "ctrlKey",
          description: "Control key"
        }
      ]
    }
  },
  subscriptions: null,
  listener: null,
  active: false,

  activate(state) {
    this.listener = getListener({
      direction: this.getConfig("direction"),
      modifierKey: this.getConfig("modifierKey")
    });

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "scroll-through-time:toggle": () => this.toggle(),
        "scroll-through-time:enable": () => this.toggle(true),
        "scroll-through-time:disable": () => this.toggle(false)
      })
    );

    this.subscriptions.add(
      atom.config.onDidChange(
        "scroll-through-time.direction",
        ({ newValue }) => {
          this.removeListener();
          this.listener = getListener({
            direction: newValue,
            modifierKey: this.getConfig("modifierKey")
          });
          if (this.active) {
            this.setupListener();
          }
        }
      )
    );

    this.subscriptions.add(
      atom.config.onDidChange(
        "scroll-through-time.modifierKey",
        ({ newValue }) => {
          this.removeListener();
          this.listener = getListener({
            direction: this.getConfig("direction"),
            modifierKey: newValue
          });
          if (this.active) {
            this.setupListener();
          }
        }
      )
    );

    if (this.getConfig("autoToggle") || state.active) {
      this.toggle(true);
    }
  },

  deactivate() {
    this.active = false;
    this.removeListener();
    this.subscriptions.dispose();
  },

  serialize() {
    return {
      active: this.active
    };
  },

  setupListener() {
    window.addEventListener("mousewheel", this.listener, {
      passive: false,
      capture: true
    });
  },

  removeListener() {
    window.removeEventListener("mousewheel", this.listener, {
      passive: false,
      capture: true
    });
  },

  toggle(force) {
    this.active = typeof force !== "undefined" ? force : !this.active;
    return this.active ? this.setupListener() : this.removeListener();
  },

  getConfig(config) {
    return atom.config.get(`scroll-through-time.${config}`);
  }
};
