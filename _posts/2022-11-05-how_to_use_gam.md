---
layout:     post
title:      How to use GAM
date:       2026-08-26 00:00:00
author:     Luke Wakefield
summary:    How to install and use GAM (Google Apps Manager), a command-line tool for managing Google Workspace.
categories: google
thumbnail: box-archive
tags:
 - gam
 - google
 - google-workspace
 - google-apps
 - admin
 - email
 - calendar
 - drive
---

This page will show you how to set up and use [**GAM**][gam] (Google Apps
Manager) — a command-line tool for managing Google Workspace. There's also a
newer fork, [GAMADV-XTD3][gamadv], with extra features.

## Installation

The wiki can be found [here][gam-wiki] — note the pages on the right under
"GAM Command Reference" for detailed instructions on how to use each feature
(for example, the page on Email).

```
bash <(curl -s -S -L https://git.io/install-gam)
gam update project
gam user "admin@example.com" check serviceaccount
gam user admin@example.com update serviceaccount
```

## Syntax

Most of the time you'll want to start a command as follows:

```
gam user "target_user@example.com"
```

This specifies the target of the following commands (in this case, the e-mail address `target_user@example.com`). This is denoted in the wiki documentation as `gam <who>`, which, at least for me, was a little confusing at first.

<br>
## Examples

### Enable/disable e-mail forwarding

```
gam user "target_user@example.com" show forwardingaddress
gam user "target_user@example.com" delete forwardingaddress "forwarding_address@external_domain.com"
gam user "target_user@example.com" forward off
gam user "target_user@example.com" forward on "forwarding_address@external_domain.com" keep
```

### Check or set out-of-office message

#### Check

The `show vacation` command will show the current settings. Note that the indentation is only for GAM, and won't appear in the real message.

```
gam user "target_user@example.com" show vacation
```

Example output:

```
User: target_user@example.com, Vacation: (1/1)
  Enabled: True
  Contacts Only: True
  Domain Only: False
  Start Date: Started
  End Date: 2026-09-08
  Subject: Thanks for your message!
  Message:
   <Vacation message>
```

#### Set

There are lots of options available when it comes to setting your message, but do note that if a message already exists, then any non-specified fields will revert to their default, and not what they were previously. For example, if you don't set `contactsonly`, then this will revert to the default of `false`, even though it was `true` before.

* `subject` — sets the subject of the message
* `file` — specify the file with the message
* or alternatively, just type your message in quotes, but this involves
  using escape characters, and `\n` for new lines
* `startdate` — set to `started` by default, or you can set it in the future
  (YYYY-MM-DD format)
* `enddate` — not set by default (so forever), or you can set it
  (YYYY-MM-DD format)
* `contactsonly` — set to `false` by default; specify this flag to set it to
  `true`
* `domainonly` — set to `false` by default; specify this flag to set it to
  `true`

```
gam user "target_user@example.com" vacation on subject "Thanks for your message\!" file target_user.txt enddate 2026-09-08 contactsonly
```

### Check which users have sharing disabled

Get a list of users:

```
gam info group "team@example.com" > users.txt
```

Then check how many have sharing disabled:

```
for user in $(cat users.txt); do echo "$user, $(gam info user $user nogroups noaliases nolicenses noschemas | grep -E 'Included in GAL')"; done > GALResults.txt
```

Then filter for the ones that are disabled:

```
grep "False" GALResults.txt
```

### Change ownership of a file

Changing to `owner` will move the current owner to `writer`.

```
gam user "target_user@example.com" show drivefileacl "1234abcd"
gam user target_user@example.com add drivefileacl 1234abcd user added_user@example.com role owner sendemail
```

### Change a calendar owner

List the current calendars to get the ID:

```
gam user target_user@example.com print calendars
```

Then list the current access control lists (ACLs) on that calendar:

```
gam calendar "target_user@example.com" printacl
```

Add the new owner (and add the calendar to the new owner's list):

```
gam calendar "target_user@example.com" add acls owner "added_user@example.com" sendnotifications false
gam user "added_user@example.com" add calendar "target_user@example.com" selected true
```

Finally, double-check the permissions.

For events (requires new GAM):

```
gam calendar "target_user@example.com" show event before now matchfield status confirmed
gam calendar "example.com_1234@resource.calendar.google.com" show event after now matchfield status confirmed
```

### Move a calendar event from one user/owner to another

First, get a list of events that you'd like to move. Here you're looking for
the `id` field:

```
gam calendar target_user@example.com print events after 2026-08-01 matchfield organizeremail organiser_email@example.com
```

Example output:

```
Getting Events for organiser_email@example.com
calendarId,id,summary,status,description,created,updated,iCalUID,attendees,...
target_user@example.com,abcd1234,<summary>,confirmed,<Description>,...
```

The `<new_user>` needs write access to the `<old_user>` calendar. Here, I'm
moving an entry from `old_user@example.com` to `new_user@example.com`:

```
gam calendar new_user@example.com show acls
```

Example output:

```
Calendar: old_user@example.com, Show 2 Calendar ACLs
  Scope: user:old_user@example.com, Role: owner (1/2)
  Scope: domain:example.com, Role: reader (2/2)
```

Add write access for the new user:

```
gam calendar old_user@example.com add acls writer new_user@example.com sendnotifications false
```

Example output:

```
Calendar: old_user@example.com, Add 1 Calendar ACL
  Calendar: old_user@example.com, Calendar ACL: (Scope: user:new_user@example.com, Role: writer), Added
```

Perform the move. Note: move the original invite if there's a recurring
event, and all following ones will move too!

```
gam calendar old_user@example.com move event id 1234abcd to new_user@example.com
```

Example output:

```
Calendar: old_user@example.com, Move 1 Event
  Calendar: old_user@example.com, Event: 1234abcd, Moved to: Calendar: new_user@example.com
```

Check that the events have been moved:

```
gam calendar target_user@example.com print events after 2026-08-01 matchfield organizeremail organiser_email@example.com
```

Revert the write permissions:

```
gam calendar old_user@example.com delete user new_user@example.com
```

Example output:

```
Calendar: old_user@example.com, Delete 1 Calendar ACL
  Calendar: old_user@example.com, Calendar ACL: (Scope: user:new_user@example.com), Deleted
```

### List Google Drive contents by size

```
gam user "target_user@example.com" show filelist name filesize | tee target_user.csv
gam user "target_user@example.com" show filelist query "name contains <search term>"
gam user "target_user@example.com" show filelist description id filesize
gam user "target_user@example.com" show filelist allfields
```

### Remove calendar entries

Use the Google portal if we can
(<https://admin.google.com/ac/apps/calendar/settings/manageevents>), or:

```
gam user "target_user@example.com" deprovision
```

### Search for email messages

Please use the email log search web interface
(<https://admin.google.com/ac/emaillogsearch>) instead, if possible. The
query to search in GAM is called `delete`, which is scary, but nothing is
deleted unless we add `doit`. Still, don't risk it if you can.

```
gam user target_user@example.com print messages query "Activate your WP Engine account"
gam user target_user@example.com print messages
gam user target_user@example.com print filters
gam user target_user@example.com filter subject "Activate your WP Engine account"
gam user target_user@example.com delete messages query 'from:"no-reply@identity.wpengine.com"'
```

### List permissions for a calendar

Note: we should contact the (owner?) of the calendar to request changes, if
possible.

```
gam user "target_user@example.com" info calendar "c_1234abcd@group.calendar.google.com"
gam calendar "target_user@example.com" printacl
gam user "target_user@example.com" print calendars
gam user "target_user@example.com" info calendar primary
gam calendar "c_1234abcd@group.calendar.google.com" showacl
```

### List all accounts created by admins

List all accounts created by admins (excluding a service account):

```
gam report admin event CREATE_USER | grep -v service_account@example.com > accounts_created_manually.csv
```

### List who created an account/mailbox

```
gam report admin event CREATE_USER | grep target_user
gam report admin event | grep target_user
```

### Licences

Note: doesn't work (at time of writing).

```
gam print licenses
gam print licenses sku 1010020026 # Google Workspace Enterprise Standard
gam print licenses sku 1010340004 # Google Workspace Enterprise Standard - Archived User
gam user "target_user@example.com" update licence 1010340004 from 1010020026 preview
```

[gam]: https://github.com/GAM-team/GAM
[gamadv]: https://github.com/taers232c/GAMADV-XTD3/wiki/Upgrade-Benefits
[gam-wiki]: https://github.com/GAM-team/GAM/wiki/
