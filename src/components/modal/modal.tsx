import * as React from "react";
import { Subject } from "rxjs";
import { iconType } from "..";

export interface IModalDialogButton {
    label: string;
    onClick: () => void;
}

export interface IGenericDialogOperation {
    add: IGenericDialog[];
    remove: IGenericDialog[];
}

export interface IGenericDialog {
    title: string;
    icon?: iconType;
    body?: JSX.Element | null;
    footer?: JSX.Element | null;
}

export interface IModalDialog {
    title: string;
    icon?: iconType;
    body?: JSX.Element | null;
    buttonsFactory: (close: (result: boolean) => void) => IModalDialogButton[];
    genericDialogCallback?: (dialog: IGenericDialog) => void;
}

export class Dialogs {
    static DialogsStream: Subject<IGenericDialogOperation> = new Subject<IGenericDialogOperation>();

    static OKCancelButtons(close: (result: boolean) => void) {
        return [
            {
                label: "OK",
                onClick: () => close(true)
            },
            {
                label: "Cancel",
                onClick: () => close(false)
            }
        ]
    }

    static Add(dialog: IGenericDialog) {
        Dialogs.DialogsStream.next({
            add: [dialog],
            remove: []
        })
    }

    static Remove(dialog: IGenericDialog) {
        Dialogs.DialogsStream.next({
            add: [],
            remove: [dialog]
        })
    }

    static async Confirm(title: string): Promise<boolean> {
        return await Dialogs.Modal({
            title,
            icon: "AiOutlineWarning",
            body: null,
            buttonsFactory: (close) => {
                return [
                    {
                        label: "OK",
                        onClick: () => close(true)
                    },
                    {
                        label: "Cancel",
                        onClick: () => close(false)
                    }
                ]
            }
        })
    }

    static async Notification(
        title: string, 
        body: JSX.Element | null = null,
        override: Partial<IModalDialog> = {}): Promise<boolean> {
        return await Dialogs.Modal({
            title,
            icon: "AiOutlineWarning",
            body: body,
            buttonsFactory: (close) => {
                return [
                    {
                        label: "Cancel",
                        onClick: () => close(false)
                    }
                ]
            },
            ...(override || {})
        })
    }

    static async Modal(dialog: IModalDialog): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const buttons = dialog
                .buttonsFactory((result) => {
                    resolve(result);
                    Dialogs.Remove(genericDialog);
                })
                .map(b => {
                    return (
                        <div key={b.label} className="modal-button" onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            b.onClick();
                        }}>{b.label}</div>
                    )
                });

            const genericDialog: IGenericDialog = {
                title: dialog.title,
                icon: dialog.icon,
                body: dialog.body,
                footer: <div>{buttons}</div>
            }

            dialog.genericDialogCallback?.(genericDialog);
            Dialogs.Add(genericDialog);
        })
    }
}
