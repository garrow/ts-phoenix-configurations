/**
 * PhizeUp.js - A reimplementation of basic SizeUp functionality using the Phoenix window manager.
 *
 *  Window partitions are as follows.
 *
 * +-----+-----+ +----------+ +-----+-----+ +--------------+
 * |     |     | |          | |     |     | |              |
 * |     |     | |    Up    | | TL  |  TR | |              |
 * |     |     | |          | |     |     | |  +--------+  |
 * |  L  |  R  | +----------+ +-----------+ |  | Center |  |
 * |     |     | |          | |     |     | |  +--------+  |
 * |     |     | |   Down   | | BL  |  BR | |              |
 * |     |     | |          | |     |     | |              |
 * +-----+-----+ +----------+ +-----+-----+ +--------------+
 *
 * The default configuration uses SizeUp like keybinds.
 *
 * However, my preferred keybinds reuse the same cmd,ctrl,alt, modifier keys and use the `rtfg`
 * letter keys on the keyboard, instead of changing modifier keys.
 *
 * Additional Partitions
 * ---------------------
 *
 * In addition I have added the following partitions, which are really only
 * useful on larger screens.
 *
 * These are bound to the number pad keys, as when I have a large screen attached, I have a full-sized keyboard.
 *
 * Below the keybinds are listed as;
 * Partition
 * (Numpad Key)
 *
 * +-----------------------------+
 * |         |         |         |
 * |   TL6   |   TC6   |   TR6   |
 * |   (7)   |   (8)   |   (9)   |
 * +-----------------------------+
 * |         |         |         |
 * |   BL6   |   BC6   |   BR6   |
 * |   (4)   |   (5)   |   (6)   |
 * +-----------------------------+
 *
 * +-----------------------------+
 * |         |         |         |
 * |  Left   |  Centre |  Right  |
 * |  Third  |  Third  |  Third  |
 * |   (1)   |   (2)   |   (3)   |
 * |         |         |         |
 * +-----------------------------+
 *
 * Credits
 * -------
 *
 * Original keybinds and the SizeUp name - SizeUp - http://www.irradiatedsoftware.com/sizeup/
 *
 * TODO List:
 * - Add spaces support.
 *
 * - Reuse the same modal object.
 * - Convert whole script to an object
 * - Simplify the configuration.
 *
 * Known Bugs
 * - When resizing windows which define a minimum size (e.g. Spotify) when placed in a
 *   small size at a screen edge may push onto another monitor.
 */

"use strict";

/**
 * Configure PhizeUp's behaviour here.
 */
const config = {
    movementAlertDuration: 0.5,
    sizeUpDefaults: false
};

type ModKeys = Phoenix.ModifierKey[]
type MultiKeys = Phoenix.KeyIdentifier[] | Phoenix.KeyIdentifier
type KeyHandler = (key: Key, repeated: boolean) => void
type Frame = Rectangle


function multiKey(keys: MultiKeys, modifiers: ModKeys, handler: KeyHandler) {
    if (!keys || !modifiers || !handler) {
        Phoenix.log("🛑 BAD KEY CONFIG")
        Phoenix.log(JSON.stringify({keys: keys, modifiers: typeof modifiers, handler: typeof handler}))
    }

    if (!Array.isArray(keys)) {
        keys = [keys]
    }
    return keys.map((key) => {
        return new Key(key, modifiers, handler)
    })
}

const Regions = [
    'left',
    'right',
    'up',
    'down',
    'topLeft',
    'bottomLeft',
    'topRight',
    'bottomRight',
    'centre',
    'maximized',
    'leftThird',
    'centreThird',
    'rightThird',
    'left2Thirds',
    'right2Thirds',
    'topLeftSix',
    'topCentreSix',
    'topRightSix',
    'botLeftSix',
    'botCentreSix',
    'botRightSix'] as const

type NamedRegion = typeof Regions[number]


const setupHandlers = (useSizeUpDefaults: boolean = true) => {
    const modKeys1: ModKeys = ['ctrl', 'alt', 'cmd'],
        modKeys2: ModKeys = ['ctrl', 'alt', 'shift'],
        screenKeys: ModKeys = ['ctrl', 'alt'];

    // Most common keybind, any of KEYS with modKeys1 to a new frame
    const movement = (keys: MultiKeys, windowMovement: NamedRegion) => {
        return multiKey(keys, modKeys1, putWindow(windowMovement))
    }


    let quarters;

    if (useSizeUpDefaults) {
        quarters = [
            multiKey('left', modKeys2, putWindow('topLeft')),
            multiKey('up', modKeys2, putWindow('topRight')),
            multiKey('down', modKeys2, putWindow('bottomLeft')),
            multiKey('right', modKeys2, putWindow('bottomRight')),
        ]
    } else {
        // The alternative keymap allows using the RTFG keys as diagonal directional arrows.
        quarters = [
            movement('r', 'topLeft'),
            movement('t', 'topRight'),
            movement('f', 'bottomLeft'),
            movement('g', 'bottomRight'),
        ]
    }

    return {
        quarters: quarters,
        halves: [
            movement('up', 'up'),
            movement('down', 'down'),
            movement('left', 'left'),
            movement('right', 'right'),
        ],
        thirds: [
            movement([',', 'keypad1'], 'leftThird'),
            movement(['.', 'keypad2'], 'centreThird'),
            movement(['/', 'keypad3'], 'rightThird'),
            movement([';', 'keypad0'], 'left2Thirds'),
            movement([`'`, 'keypad.'], 'right2Thirds'),
        ],
        sixths: [
            movement(['u', 'keypad7'], 'topLeftSix'),
            movement(['i', 'keypad8'], 'topCentreSix'),
            movement(['o', 'keypad9'], 'topRightSix'),
            movement(['j', 'keypad4'], 'botLeftSix'),
            movement(['k', 'keypad5'], 'botCentreSix'),
            movement(['l', 'keypad6'], 'botRightSix'),
        ],

        centre: movement(['c', 'keypad-'], 'centre'),
        maximize: multiKey(['m', 'keypad+'], modKeys1, maximize()),
        screenNext: multiKey(['left', 'right'], screenKeys, putWindowScreen('next')),
        screenNextMax: multiKey(['left', 'right'], modKeys2, putWindowScreen('anything', true)),
        appSelect: multiKey('space', modKeys1, appSelector),
    };
};

// double ⇦⇧⇨⇩⇖⇗⇘⇙⤄
// chunky ⬆︎⬇︎⬊⬈⬉⬋➡︎⬅︎
// simple ↑↓←→↖︎↘︎↗︎↙︎
//
// `½
// ◼︎◼︎
// ◻︎◻︎
// ↑`
//
// `½
// ◼︎◼︎
// ◻︎◻︎
// ↑`

type MovementMap = {
    [r in NamedRegion]: string
} & {
    get: (s: NamedRegion) => string
}
const Movements: MovementMap = {
    up: `½ ◼︎◼︎ ◻︎◻︎ ↑`,
    down: `½ ◻︎◻︎ ◼︎◼︎ ↓`,
    left: `½ ◼︎◻︎ ◼︎◻︎ ←`,
    right: `½\n◻︎◼︎\n◻︎◼︎\n→`,

    topLeft: "¼\n◼︎◻︎\n◻︎◻︎\n↖︎",
    topRight: "¼\n◻︎◼︎\n◻︎◻︎\n↗︎",
    bottomLeft: "¼\n◻︎◻︎\n◼︎◻︎\n↙︎",
    bottomRight: "¼\n◻︎◻︎\n◻︎◼︎\n↘︎",

    maximized: "↖︎↑↗︎\n←◼︎→\n↙︎↓↘︎",
    centre: "↘︎↓↙︎\n→⧈←\n↗︎↑↖︎",

    leftThird: "⅓\n◼︎◻︎◻︎\n◼︎◻︎◻︎\n←",
    centreThird: "⅓\n◻︎◼︎◻︎\n◻︎◼︎◻︎\n→←", /// ⇹ ⤄
    rightThird: "⅓\n◻︎◻︎◼︎\n◻︎◻︎◼︎\n→",

    left2Thirds: "⅔\n◼︎◼︎◻︎\n◼︎◼︎◻︎\n←",
    right2Thirds: "⅔\n◻︎◼︎◼︎\n◻︎◼︎◼︎\n→",

    topLeftSix: "⅙\n◼︎◻︎◻︎\n◻︎◻︎◻︎\n↖︎",
    topCentreSix: "⅙\n◻︎◼◻︎\n◻︎◻︎◻︎\n↑",
    topRightSix: "⅙\n◻︎◻︎◼\n◻︎◻︎◻︎\n↗︎",
    botLeftSix: "⅙\n◻︎◻︎◻︎\n◼◻︎◻︎\n↙︎",
    botCentreSix: "⅙\n◻︎◻︎◻︎\n◻︎◼◻︎\n↓",
    botRightSix: "⅙\n◻︎◻︎◻︎\n◻︎◻︎◼\n↘︎",

    // Safely fall back to a plain text label.
    get(direction) {
        return String(this[direction]).split(' ').join("\n").replace(/ +/g, '') || direction.toString();
    },
};


/**
 * Sometimes a window doesn't actually exist.
 *
 * @param window
 * @param action
 * @returns {*}
 */
const withWindow = (window: Window | undefined, action: (window: Window) => void) => {
    if (window) {
        return action(window);
    }
    alertModal("Nothing to move");
};

/**
 * Build and return a handler which puts the focused (active) window into a position on that window's current screen.
 *
 * @param direction [Any Movement]
 * @returns {Function}
 */
const putWindow = (direction: NamedRegion): KeyHandler => {
    return (_key, _repeated) => {

        withWindow(Window.focused(), (window) => {
            const screenFrame = window.screen().flippedFrame();

            windowMovedAlert(Movements.get(direction), window);
            setInSubFrame(window, screenFrame, direction);
        });
    };
};

/**
 * Place the window into a subframe inside the parent frame.
 *
 * @param window
 * @param parentFrame
 * @param direction
 */
const setInSubFrame = (window: Window, parentFrame: Frame, direction: NamedRegion) => {
    const _oldFrame = window.frame()
    const newWindowFrame = getSubFrame(parentFrame, direction);

    // alertInFrame(changeDirection(newWindowFrame, _oldFrame), _oldFrame, window.screen());

    window.setFrame(newWindowFrame);
};

/**
 * Build and return a handler to maximize the focused window.
 * @returns {Function}
 */
const maximize = () => {
    return () => {
        withWindow(Window.focused(), (window) => {
            windowMovedAlert(Movements.maximized, window);
            window.maximize();
        });
    };
};


/**
 * Build a subframe within a parent frame.
 * This fn does the work of subdividing the rectangle. (screen)
 *
 * @param parentFrame
 * @param direction
 * @returns {*} / Rectangle
 */
const getSubFrame = (parentFrame: Frame, direction: NamedRegion): Frame => {
    /**
     * When using multiple screens, the current screen may be offset from the Zero point screen,
     * using the raw x,y coords blindly will mess up the positions.
     * Instead, we offset the screen x,y, coords based on the original origin point of the screen.
     *      |---|
     *  |---|---|
     * In this case we have two screens side by side, but aligned on the physical bottom edge.
     * Remember that coords are origin 0,0 top left.
     * screen 1.  { x: 0, y: 0, width: 800, height: 600 }
     * screen 2.  { x: 800, y: -600, width: 1600, height: 1200 }
     **/
    const parentX = parentFrame.x;
    const parentY = parentFrame.y;
    const fullWide = parentFrame.width;
    const fullHight = parentFrame.height;

    const change = (original: number) => {
        return (changeBy: number = 0) => {
            const offset = changeBy || 0;
            return Math.round(original + offset);
        };
    };

    const y = change(parentY);
    const x = change(parentX);

    const narrow = Math.round(fullWide / 2)
    const halfHight = Math.round(fullHight / 2);
    const oneThird = Math.round(fullWide / 3);
    const twoThirds = Math.round(oneThird * 2);

    const subFrames = {
        left: {y: y(), x: x(), width: narrow, height: fullHight},
        right: {y: y(), x: x(narrow), width: narrow, height: fullHight},
        up: {y: y(), x: x(), width: fullWide, height: halfHight},
        down: {y: y(halfHight), x: x(), width: fullWide, height: halfHight},
        topLeft: {y: y(), x: x(), width: narrow, height: halfHight},
        bottomLeft: {y: y(halfHight), x: x(), width: narrow, height: halfHight},
        topRight: {y: y(), x: x(narrow), width: narrow, height: halfHight},
        bottomRight: {y: y(halfHight), x: x(narrow), width: narrow, height: halfHight},
        centre: {y: y(halfHight / 2), x: x(narrow / 2), width: narrow, height: halfHight},
        leftThird: {y: y(), x: x(), width: oneThird, height: fullHight},
        centreThird: {y: y(), x: x(oneThird), width: oneThird, height: fullHight},
        rightThird: {y: y(), x: x(twoThirds), width: oneThird, height: fullHight},
        left2Thirds: {y: y(), x: x(), width: twoThirds, height: fullHight},
        right2Thirds: {y: y(), x: x(oneThird), width: twoThirds, height: fullHight},
        topLeftSix: {y: y(), x: x(), width: oneThird, height: halfHight},
        topCentreSix: {y: y(), x: x(oneThird), width: oneThird, height: halfHight},
        topRightSix: {y: y(), x: x(twoThirds), width: oneThird, height: halfHight},
        botLeftSix: {y: y(halfHight), x: x(), width: oneThird, height: halfHight},
        botCentreSix: {y: y(halfHight), x: x(oneThird), width: oneThird, height: halfHight},
        botRightSix: {y: y(halfHight), x: x(twoThirds), width: oneThird, height: halfHight}
    } as const;

    type RegionNames = keyof typeof subFrames

    // type SubFrame =  keyof typeof subFrames

    return subFrames[direction as keyof typeof subFrames];
};
/**
 * Render a Phoenix Modal with a string message.
 *
 * TODO - Reuse the same Modal object to avoid artifacts when repeating actions and building lots of modals.
 *
 * @param message
 * @param onScreen
 * @returns {Modal}
 */
const alertModal = (message: string, onScreen?: Screen) => {
    const alertModal = new Modal();
    alertModal.textAlignment = 'center'
    alertModal.duration = config.movementAlertDuration;
    alertModal.text = message;
    alertModal.weight = 30;


    const screenFrame = (onScreen || Screen.main()).visibleFrame();
    const alertFrame = alertModal.frame();

    alertModal.origin = {
        x: (screenFrame.x + (screenFrame.width * 0.5)) - (alertFrame.width * 0.5),
        y: (screenFrame.y + (screenFrame.height * 0.5)) - (alertFrame.height * 0.5)
    };

    alertModal.show();

    return alertModal;
};


const alertInFrame = (message: string, inFrame: Rectangle, onScreen?: Screen) => {
    const alertInFrame = new Modal();
    alertInFrame.textAlignment = 'right' // 3.0.0 ? 'right' makes the text centered?
    alertInFrame.duration = config.movementAlertDuration;
    alertInFrame.text = message;
    alertInFrame.weight = 30;


    const screenFrame = (onScreen || Screen.main()).visibleFrame();
    const alertFrame = alertInFrame.frame();

    alertInFrame.origin = {
        x: (inFrame.x + (inFrame.width * 0.5)) - (alertFrame.width * 0.25),
        y: (inFrame.y + (inFrame.height * 0.5)) - (alertFrame.height * 0.25)
    };

    alertInFrame.show();

    return alertInFrame;
}


/**
 * Places an alertModal on the screen the window was on, with the provided text message.
 *
 * @param message
 * @param window
 */
const windowMovedAlert = (message: string, window: Window) => {
    if (window) {
        alertModal(message, window.screen());
    }
};


/**
 * Puts a window to a new screen.
 *
 * @param keepMaximized
 */
const putWindowScreen = (toScreen: string, keepMaximized = false) => {
    return () => {
        const window = Window.focused();

        if (window === undefined) {
            alertModal("NO Windows for current app");
            return;
        }

        const currentScreen = window.screen();
        const screenList = Screen.all();

        if (screenList.length < 2) {
            alertModal("No other screen");
            return;
        }

        const candidateOtherScreens = screenList.filter((s: Screen) => (s.identifier() !== currentScreen.identifier()));



        const newScreen = candidateOtherScreens[0];

        if (!newScreen) {
            alertModal("No screens available");
            return
        }
        const newScreenFrame = newScreen.flippedVisibleFrame();

        const oldFrame = window.frame();

        const currentScreenFrame = currentScreen.visibleFrame()

        const newX = newScreenFrame['x'];
        const newY = newScreenFrame['y'];
        let newWidth;
        let newHeight;

        // Maximized
        if (keepMaximized && currentScreenFrame.width === oldFrame.width && currentScreenFrame.height === oldFrame.height) {
            newWidth = newScreenFrame.width
            newHeight = newScreenFrame.height
        } else {
            // Shrink to fit
            newWidth = Math.min(oldFrame.width, newScreenFrame.width)
            newHeight = Math.min(oldFrame.height, newScreenFrame.height)
        }

        const newFrame = {
            y: newY,
            x: newX,
            width: newWidth,
            height: newHeight
        };

        const windowMovement = changeDirection(newFrame, oldFrame)
        const message = `📺\n${windowMovement}`

        alertModal(message, currentScreen)
        alertModal(message, newScreen)

        window.setFrame(newFrame);
    };
};

// Given two frames, compare the x,y points, return a compass direction of the change.
const changeDirection = (newFrame: Frame, oldFrame: Frame) => {
    const xdir = Math.sign(newFrame.x - oldFrame.x)
    const ydir = Math.sign(newFrame.y - oldFrame.y)
    const directions = [
        ['↖︎', '↑', '↗︎'],
        ['←', 'o', '→'],
        ['↙︎', '↓', '↘︎'],
    ]
    const dir = directions[ydir + 1][xdir + 1]

    return dir
}


var appSelectorModal: Modal | null = null
var windowListModal: Modal | null = null

type Ident = string | number
type WindowList = { [hash: Ident]: WindowInfo } | null
var windowListCache: WindowList = null


type ModalPool = { [hash: Ident]: Modal } | null
var windowListPool: ModalPool = null

class WindowInfo {
    searchable;
    hash;
    ref;
    appName;
    title;
    isFullScreen;
    isMinimized;
    isVisible;

    constructor(appWindow: Window) {
        const appWindowApp = appWindow.app()
        this.searchable = `${appWindow.title()} - ${appWindowApp.name()}`
        this.hash = appWindow.hash();
        this.ref = appWindow
        this.appName = appWindowApp.name();
        this.title = appWindow.title();
        this.isFullScreen = appWindow.isFullScreen();
        this.isMinimized = appWindow.isMinimized();
        this.isVisible = appWindow.isVisible();
    }
}


var appSelectorState = {
    filterText: '',
    bestMatch: ''
}


const appSelector = () => {
    // debug({'fired': 'appSelector', appSelectorModal: appSelectorModal, windowListModal: windowListModal})

    if (shutdownWindowSelector()) {
        Phoenix.log("🚧 Closing App Selector windows")
        return
    }

    Phoenix.log("🧱 Opening App Selector")

    appSelectorModal = Modal.build({
        isInput: true,
        inputPlaceholder: 'Filter windows',
        textDidChange: onFilterChange,

        // TODO - Add defintion for the 4.0 `textDidCommit` property
        // @ts-ignore
        textDidCommit: onFilterCommit,

    })

    const screenFrame = Screen.main().visibleFrame();
    const appSelectorFrame = appSelectorModal.frame();

    appSelectorModal.origin = {
        x: (screenFrame.x + (screenFrame.width * 0.5)) - (appSelectorFrame.width * 0.5),
        y: (screenFrame.y + (screenFrame.height * 0.5)) - (appSelectorFrame.height * 0.5)
    };

    updateWindowListModal('')
    appSelectorModal.show()
}


const getWindowList = () => {
    const start = Date.now();
    const allWindows = Window.all().filter((w) => w.isNormal())

    var windowList: WindowList = {}

    for (const windowsListKey in allWindows) {
        const appWindow = allWindows[windowsListKey]
        if (!appWindow.isNormal()) {
            continue;
        }

        windowList[appWindow.hash()] = new WindowInfo(appWindow)
    }

    windowListCache = windowList
    const end = Date.now();
    Phoenix.log(`getWindowList took ${end - start}`)
    return windowListCache
}

/**
 *
 * @param windowInfo WindowInfo
 * @param filterText string
 */
function applyFilter(windowInfo: WindowInfo, filterText = '') {


}


const filterWindowList = (windowList: WindowList, filterText = '') => {

    var filteredList = []

    for (const hashKey in windowList) {
        const entry = windowList[hashKey]

        const matching = entry.searchable.toLowerCase().includes(String(filterText).toLowerCase())

        if (matching) {
            // appListDebug.push(entry.searchable)
            filteredList.push(entry)
        }

    }
    return filteredList
}


const updateWindowListModal = (newFilterValue = '') => {
    const allWindows = getWindowList()
    const filteredWindows = filterWindowList(allWindows, newFilterValue)

    renderWindowsList(allWindows, filteredWindows)
}

const renderWindowsList = (allWindows: WindowList, filteredWindows: WindowInfo[]) => {

    Phoenix.log("🪟🪟🪟🪟🪟renderWindowsList")


    if (windowListPool === null) {
        Phoenix.log("🪟🪟🪟🪟🪟windowListPool === null")
        windowListPool = {}
    }

    const filteredHashes = filteredWindows.map((w) => {
        return w.hash
    })

    const screenFrame = Screen.main().visibleFrame();

    var idx = 0;

    for (const windowKey in allWindows) {

        const win = allWindows[windowKey]
        Phoenix.log(`🪟🪟🪟🪟🪟${win.searchable}`)


        var windowListItem = windowListPool[win.hash]

        if (windowListItem) {
            // Phoenix.log(`🪟🪟🪟🪟🪟!!!! Closing stale`)
            windowListItem.close()
        }

        windowListItem = buildWindowPreview(win)


        windowListPool[win.hash] = windowListItem


        const inFiltered = filteredHashes.includes(win.hash)

        if (inFiltered) {
            // windowListItem.setTextColor(255,255,255, 1)
            windowListItem.appearance = 'dark'
        } else {
            // windowListItem.setTextColor(255,255,255, 0.5)
            windowListItem.appearance = 'light'
        }

        const frame = windowListItem.frame()

        windowListItem.origin = {x: 500, y: (frame.height * idx) + 50}

        windowListItem.show()

        idx += 1;
    }
}


function buildWindowPreview(windowInfo: WindowInfo): Modal {
    return Modal.build({
        text: windowInfo.searchable,
        weight: 12,
        animationDuration: 0,
        duration: 0,
        icon: windowInfo.ref.app().icon()
    })
}


const shutdownWindowSelector = () => {
    var didShutdown = false

    Phoenix.log("🧹 shutdownWindowSelector")


    if (windowListPool !== null) {
        Phoenix.log("🧹 windowListPool")

        for (const poolKey in windowListPool) {
            const windowListItem = windowListPool[poolKey]
            if (windowListItem !== null) {
                Phoenix.log("🧹 cleaning up windowListItem")
                windowListItem.close()
                // Phoenix.log("🧹 cleaning up windowListPoolElement")
            }

        }


    }


    if (windowListModal !== null) {
        windowListModal.close()
        windowListModal = null
        didShutdown = true
    }

    if (appSelectorModal !== null) {
        appSelectorModal.close()
        appSelectorModal = null
        didShutdown = true
    }

    return didShutdown
}

type TextDidChange = (newText: string) => void
const onFilterChange: TextDidChange = (textChanged) => {
    Phoenix.log(`FILTER CHANGE: ${textChanged}`)
    // debug("FILTER CHANGE")
    updateWindowListModal(textChanged)
    if (appSelectorModal !== null) {
        // TODO - Add defintion for version 4.0 Modal#focus()
        // @ts-ignore
        appSelectorModal.focus() // Return focus to the Input modal after showing the window modals.
    }
    // debug(textChanged)
}


type TextDidCommitReason = 'return' | 'tab' | 'backtab' | undefined
type TextDidCommit = (filterText: string, reason: TextDidCommitReason) => void
const onFilterCommit: TextDidCommit = (filterText: string = '', reason: TextDidCommitReason) => {
    if (filterText === "") {
        Phoenix.log(`EMPTY FILTER (${reason})  ${filterText} `)
        shutdownWindowSelector()
        return
    }

    Phoenix.log(`FILTER COMMIT: (${reason})  ${filterText} `)

    const finalList = filterWindowList(getWindowList(), filterText)

    if (finalList.length === 0) {
        shutdownWindowSelector()
        return
    } else {
        const windowCandidate = finalList[0]

        try {
            const focusResult = windowCandidate.ref.focus()
            Phoenix.log(`FOCUS (${focusResult}): ${windowCandidate.hash} - ${windowCandidate.title}`)
        } catch (e) {
            Phoenix.log(`Could not focus with broken ref: ${windowCandidate.hash} - ${windowCandidate.title}`)
        }

        shutdownWindowSelector()
        return
    }

    // shutdownWindowSelector()
}


const debug = (o: any) => {
    Phoenix.notify(JSON.stringify(o, null, 2));
}


const debugLog = (o: any) => {
    Phoenix.log(JSON.stringify(o, null, 2));
}
// const debugscreen = () => {
//     debug((Window.focused().screen().flippedFrame()))
// }


// Phoenix.on('screensDidChange', >

// Phoenix requires us to keep a reference to the key handlers.
const keyHandlers = setupHandlers(config.sizeUpDefaults);
