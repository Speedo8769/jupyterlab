// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette, InstanceTracker
} from '@jupyterlab/apputils';

import {
  ImageViewer, ImageViewerFactory, IImageTracker
} from '@jupyterlab/imageviewer';

/**
 * The command IDs used by the image widget plugin.
 */
namespace CommandIDs {
  export
  const resetImage = 'imageviewer:reset-image';

  export
  const zoomIn = 'imageviewer:zoom-in';

  export
  const zoomOut = 'imageviewer:zoom-out';

  export
  const rot90 = 'imageviewer:rotate-clockwise';

  export
  const rot270 = 'imageviewer:rotate-counterclockwise';
}


/**
 * The list of file types for images.
 */
const FILE_TYPES = [
  'png', 'gif', 'jpeg', 'svg', 'bmp', 'ico', 'xbm', 'tiff'
];

/**
 * The name of the factory that creates image widgets.
 */
const FACTORY = 'Image';

/**
 * The image file handler extension.
 */
const plugin: JupyterLabPlugin<IImageTracker> = {
  activate,
  id: '@jupyterlab/imageviewer-extension:plugin',
  provides: IImageTracker,
  requires: [ICommandPalette, ILayoutRestorer],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


/**
 * Activate the image widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer): IImageTracker {
  const namespace = 'image-widget';
  const factory = new ImageViewerFactory({
    name: FACTORY,
    modelName: 'base64',
    fileTypes: FILE_TYPES,
    defaultFor: FILE_TYPES,
    readOnly: true
  });
  const tracker = new InstanceTracker<ImageViewer>({ namespace });

  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  app.docRegistry.addWidgetFactory(factory);

  factory.widgetCreated.connect((sender, widget) => {
    // Notify the instance tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => { tracker.save(widget); });
    tracker.add(widget);

    const types = app.docRegistry.getFileTypesForPath(widget.context.path);

    if (types.length > 0) {
      widget.title.iconClass = types[0].iconClass;
      widget.title.iconLabel = types[0].iconLabel;
    }
  });

  addCommands(app, tracker);

  const category = 'Image Viewer';

  [CommandIDs.zoomIn, CommandIDs.zoomOut, CommandIDs.resetImage, CommandIDs.rotateClockwise, CommandIDs.rotateCounterclockwise]
    .forEach(command => { palette.addItem({ command, category }); });

  return tracker;
}


/**
 * Add the commands for the image widget.
 */
export
function addCommands(app: JupyterLab, tracker: IImageTracker) {
  const { commands } = app;

  /**
   * Whether there is an active image viewer.
   */
  function isEnabled(): boolean {
    return tracker.currentWidget !== null &&
           tracker.currentWidget === app.shell.currentWidget;
  }

  commands.addCommand('imageviewer:zoom-in', {
    execute: zoomIn,
    label: 'Zoom In',
    isEnabled
  });

  commands.addCommand('imageviewer:zoom-out', {
    execute: zoomOut,
    label: 'Zoom Out',
    isEnabled
  });

  commands.addCommand('imageviewer:reset-image', {
    execute: resetImage,
    label: 'Reset Image',
    isEnabled
  });

  commands.addCommand('imageviewer:rotate-clockwise', {
    execute: rotateClockwise,
    label: 'Rotate Clockwise',
    isEnabled
  });

  commands.addCommand('imageviewer:rotate-counterclockwise', {
    execute: rotateCounterclockwise,
    label: 'Rotate Counterclockwise',
    isEnabled
  });

  function zoomIn(): void {
    const widget = tracker.currentWidget;

    if (widget) {
      widget.scale = widget.scale > 1 ? widget.scale + 0.5 : widget.scale * 2;
    }
  }

  function zoomOut(): void {
    const widget = tracker.currentWidget;

    if (widget) {
      widget.scale = widget.scale > 1 ? widget.scale - 0.5 : widget.scale / 2;
    }
  }

  function resetImage(): void {
    const widget = tracker.currentWidget;

    if (widget) {
      widget.scale = 1;
      widget.rotation = 0;
    }
  }

  function rotateClockwise(): void {
    const widget = tracker.currentWidget;

    if (widget) {
      widget.rotation += 90;
    }
  }

  function rotateCounterclockwise(): void {
    const widget = tracker.currentWidget;

    if (widget) {
      widget.rotation -= 90;
    }
  }
}

