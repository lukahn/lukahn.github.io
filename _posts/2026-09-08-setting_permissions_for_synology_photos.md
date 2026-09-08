---
layout:     post
title:      Setting permissions for Synology Photos
date:       2026-09-08 00:00:00
author:     Luke Wakefield
summary:    Enabling photo backups from Android/iOS to Synology Photos where each user gets their own folder — and the Windows ACL setting you also need to switch on.
categories: synology
thumbnail: images
tags:
 - synology
 - nas
 - photos
 - permissions
 - acl
 - backup
 - android
 - ios
---

I wanted each person in the house to back up their phone's photos into their own folder in Synology Photos, without anyone being able to see or touch anyone else's photos. In theory that's a five-minute job: create a folder per user and scope the permissions. In practice it took far longer than it should have, because there are **two** separate permission systems involved and only one of them lives where you'd expect.

The first system is Synology Photos' own Shared Space permissions, which are scoped to users and groups. The second is the shared folder's **Windows ACL** setting in DSM itself. If you only do the first, everything looks correct in the app, but folders created through the mobile app end up with the wrong permissions and other users can't upload into them. This post walks through both parts.

<br>
## 1. Grant each user their own folder in Shared Space

Synology's own guide covers this in detail. Sign in to Synology Photos with an administrator account, open the **Account** menu, and go to **Settings > Shared Space > Set Access Permissions** ([Synology Knowledge Center][synology-kb]).

Each non-admin user should be set to **Custom** rather than **Full Access** (Full Access is effectively an administrator). A Custom user can open Shared Space but can't see any folders until you grant access to them individually.

You can grant folder access either way:

* **In batch** — from **Settings > Shared Space > Set Access Permissions**, find the target user and click **Assign**.
* **Individually** — in **Photos > Folder View**, select a folder and click **Set folder permissions**, then configure the **Privacy Settings** and add the user to the **Invitee List**.

When you add a user you pick a role: **Viewer**, **Downloader**, **Uploader** or **Manager**. For phone backup, **Uploader** is enough — it allows uploading and creating folders, but not deleting files or folders.

One gotcha worth knowing: Synology Photos only supports individual permissions on **1st and 2nd level folders**. Folders at the 3rd level and below inherit the 2nd level folder's settings, and users need at least **Viewer** access to every parent folder above the one they're using. If you lock a subfolder down but leave a parent folder inaccessible, the user still can't get in.

<br>
## 2. Turn on Windows ACL on the shared folder

This is the part that caught me out, and it's easy to miss because it lives in DSM, not in Synology Photos. Folders created through the iOS/Android app were coming out with the wrong default permissions — a user in the right group with the right folder permissions still couldn't upload or move photos into them. Creating the same folder from File Station or a laptop worked fine, which pointed at the app rather than the permissions themselves.

The fix, per [this SynoForum thread][synoforum], is to convert the shared folder that Synology Photos uses to **Windows ACL**:

1. In DSM, open **Control Panel > Shared Folder**.
2. Select the folder Synology Photos uses (typically `photo` or `photos`).
3. Open the **Action** menu and choose **Convert to Windows ACL**.

The poster describes it as a leftover from DSM 6.x. After the conversion, subfolders created through the mobile app inherit the correct permissions, and files are owned by the "Synology Photos" service account rather than the app.

There's no obvious downside mentioned for a standard home setup, but as with any change to a shared folder's permissions, it's worth taking a snapshot or backing up the folder first if the photos aren't stored anywhere else.

<br>
## References

* Synology Knowledge Center — [How do I set access permissions for Synology Photos Shared Space?][synology-kb]
* SynoForum — [Permissions in shared space / Synology Photos][synoforum]

[synology-kb]: https://kb.synology.com/en-in/DSM/tutorial/How_do_I_set_access_permissions_for_Synology_Photos_Shared_Space#x_anchor_id4
[synoforum]: https://www.synoforum.com/threads/permissions-in-shared-space-synology-photos.13315/
