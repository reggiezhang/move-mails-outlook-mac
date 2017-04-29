#!/usr/bin/env osascript -l JavaScript

"use strict";
var outlook = Application("Microsoft Outlook");
function getParentFolderName(folder) {
    return folder.container().name() != null ? "/" + folder.container().name() : "";
}
function findSubFolderByName(folder, name) {
    return folder.mailFolders().find(function (subFolder) {
        return subFolder.name() == name;
    });
}
function msgCntInFolderForArchiving(folder) {
    return folder.messages().length - folder.unreadCount();
}
function moveMsgs(srcFolder, destFolder) {
    srcFolder.messages().forEach(function (msg) {
        if (msg.isRead()) {
            outlook.move(msg, { to: destFolder });
        }
    });
}
function archiveFolder(srcFolder, destFolder) {
    var msgCnt = msgCntInFolderForArchiving(srcFolder);
    var parentName = getParentFolderName(srcFolder);
    console.log("Archiving: %s/%s (%d)", parentName, srcFolder.name(), msgCnt);
    moveMsgs(srcFolder, destFolder);
    var srcSubFolders = new Array();
    srcFolder.mailFolders().forEach(function (srcSubFolder) {
        var msgCnt = msgCntInFolderForArchiving(srcSubFolder);
        var destSubFolder = findSubFolderByName(destFolder, srcSubFolder.name());
        if (destSubFolder != null) {
            archiveFolder(srcSubFolder, destSubFolder);
        } else {
            console.log("Skipping : /%s/%s (%d)", srcFolder.name(), srcSubFolder.name(), msgCnt);
        }
    });
}
function getDestAccount(email) {
    var destAccount = outlook.exchangeAccounts().find(function (elem) {
        return elem.emailAddress() == email;
    });
    if (!destAccount) throw "Cannot found dest account: " + email;
    return destAccount;
}
function getDestFolder(destAccount, folderName) {
    var destFolder = destAccount.mailFolders().find(function (elem) {
        return elem.name() == folderName;
    });
    if (!destFolder) throw "Cannot found dest folder: " + folderName;
    return destFolder;
}
function run(argv) {
    if (argv.length < 2) {
        return "usage: move-mails-outlook-mac.js <email> <folder>";
    }
    var destAccount = getDestAccount(argv[0]);
    var destFolder = getDestFolder(destAccount, argv[1]);

    var srcAccount = outlook.defaultAccount();
    var srcFolder = srcAccount.inbox();

    console.log("Archiving messages from " + srcAccount.name() + "/Inbox to " + destAccount.name() + "/" + destFolder.name());
    archiveFolder(srcFolder, destFolder);
}





