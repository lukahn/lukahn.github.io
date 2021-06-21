---
layout:     post
title:      Working with subtitles
date:       2021-06-20 12:30:00
author:     Luke Wakefield
summary:    A list of tasks for managing subtitles in video files.
categories: website
thumbnail: heart
tags:
 - subtitles
 - ffmpeg
 - youtube-dl
 - AnyStream
 - ExpressVPN
 - Netflix
 - Amazon
---

I'm a big fan of subtitles, and find that it's useful in making sure that I don't miss any dialog,
or so I can watch a video without audio. Below are some of the slightly more unusual tasks I've done
when working with subtitles.

Adding a subtitle to a video
First off, here's how to add a simple subtitle file (SubRip/srt) to an mp4 video:
-Insert code

But what if we want to add the subtitle, but not have it automatically display? To do that, we would run the following:
-Insert code

One of the main ways that I get videos is using youtube-dl. This has a few options for subtitles:
-Insert code for listing subtitles
-Insert code for using one sub
-Insert code for using all subs
-Insert code for auto subs
-Insert code for saving the subs separately
-Insert code for downloading subs in different formats (e.g. BBC iPlayer only uses ttml, which ffmpeg can't use.

When downloading from Netflix or Amazon Prime Video, the best tool I've come across is AnyStream. The best VPN I've found
that actually works with these services to get content from other countries is ExpressVPN.
The trial period is very generous (21 day trial, with one whole video a day). This can be used to download subtitles too.
If the subtitles are in a different language character set (e.g. Japanese), the the subtitles will be in a format called VobSub
(A .sub and a .idx file, .sub being the picture, and .idx containing info on size, colour, position and timing
This is a graphical representation of the characters, and not text itself. You can confirm this using ffmpeg:
-Code for listing streams

The best way of extracting subtitles is:
-Code for extracting text subtitles (srt)

But dvd_stream subtitles are in).
To extract these, you'll need to use YAMB

Then to translate these, you'll want a tool called Subtitle Edit, which does OCR recognition. For non-latin, use __ mode.

Then you can run this new srt file though a translation program. Results will vary greatly, and getting subtitles elsewhere is
by far the better option, but for obscure shows that are only in a foreign language, then this may be your best bet.

[1]: https://forum.videohelp.com/threads/377989-Problems-extracting-subtitle-from-MP4-files#post2440660
[2]: https://www.afterdawn.com/guides/archive/subtitle_formats_explained.cfm
