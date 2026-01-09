---
title: Reverse Engineering Ghost Toolbox
description: My first attempt at trying to reverse engineer a program
date: 2025-07-09T20:41:39.309Z
lastmod: 2026-01-08T06:43:46.773Z
tags:
    - post
layout: "layout/post.html"
comments: true
---

{% quote %}
I will not be surprised if any of what I talk about in this post gets changed, I just thought it was cool.
{% endquote %}

It all started with me wanting to figure out what kind of tool a custom Windows ISO was using to download stuff like FireFox or Chrome. I wanted to see if I could make my own version of it.

I tried looking for some python tool that I remember from one of them, but I couldn't find it. So I decided to install the OS that I knew had something like that and oh wow did that ever send me down a rabbit hole.

----

## Ghost Spectre
I decided to install the OS that I knew had a tool, as I mentioned above. It took me a while to actually even download the ISO, which was its own mess that I don't want to go through again, nor will I discuss how to download it as this is not what this post is for.

I installed Ghost Spectre into a VM using VMWare, which gives me a safe space to mess around with.

{% quotewarning %}
I want to point out that installing a custom Windows ISO can put you at risk to getting malware. <b>DO NOT</b> install custom Windows ISOs unless you either know what you are doing, or know what you are going to get into.
{% endquotewarning %}

Once I Ghost Spectre (which I will just be calling "Ghost" from here on out), I quickly located where the tool's EXE was located, the tool being called "Ghost Toolbox", which I will just call "Toolbox".
I ended up finding the toolbox in <code class="language-markup">C:\Ghost Toolbox\ </code> and there were 2 files, and a folder. One file was the actual EXE called <code class="language-markup">toolbox.updater.x64.exe</code>, a config called <code class="language-markup">toolbox.updater.x64.config</code>, and the folder was called <code class="language-markup">wget</code>.

<img alt="A screenshot of the Windows File Explorer, showing 3 items listed. In order, they are: 'wget', 'toolbox.updater.x64.config' and 'toolbox.updater.x64.exe'" src="/asset/img/post-assets/rev-eng-ghost/toolboxLocated.png">

When I run the program, I see a CLI application open, followed by PowerShell and <abbr title="Command Prompt">CMD</abbr> open, which contains the actual toolbox.

<img alt="A screenshot of Ghost Toolbox's Main Menu" src="/asset/img/post-assets/rev-eng-ghost/toolboxMenu.png">

----

## Looking in the Program

I thought, since it is just running the Command Prompt, that it has to be a batch script running somewhere. I downloaded Sysinternals [Process Monitor (Procmon)](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) and [Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) to explore what exactly the program was doing. As I watched, I noticed in Procmon that the toolbox EXE kept executing CMD, which tells me that it is indeed just running a script file (often called a Batch file) somewhere on the system.

At that point, I opened Process Explorer, which is pretty much Task Manager but on steroids. Once I opened it, I closed the toolbox and re-ran it. As it was executing, I froze Process Explorer, making it so it doesn't update, and I was right, it was indeed running a CMD window... and I could see one of many arguments that most likely were running. It is at this point, I downloaded another Sysinternals tool called [Strings](https://learn.microsoft.com/en-us/sysinternals/downloads/strings), which pretty much allows me to view all the strings in a program (who would have guessed). I ran it on the program and got a lot of garbage, but as the output was going by, I noticed a few long strings that looked interesting, so I redirected the output of strings to a text file, and after filtering out all the garbage, I found what I was looking for, a set of command line instructions.

The string of code I found was the following:

<pre><code class="language-batch line-numbers">%COMSPEC% /c del /q /f wget\update >nul 2>nul
%COMSPEC% /c del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd >nul 2>nul
%COMSPEC% /c wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update >nul 2>nul
%COMSPEC% /c timeout /t 1 >nul 2>nul
%COMSPEC% /c wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests >nul 2>nul
%COMSPEC% /c del /a /q /f %Windir%\System32\wbem\en-US\update.cmd >nul 2>nul
%COMSPEC% /c timeout /t 1 >nul 2>nul
%COMSPEC% /c rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd >nul 2>nul
%COMSPEC% /c attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd >nul 2>nul
%COMSPEC% /c %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd >nul 2>nul
%COMSPEC% /c del /q /f wget\update >nul 2>nul</code></pre>

Okay... thats a lot, let's take a little bit to break that down... <code class="language-markup">%COMSPEC%</code> is a variable in the command prompt built into Windows, which just points to where CMD is and <code class="language-markup">/c</code> just tells it to execute a command before closing. So I am just going to ignore that. And you may have noticed at the end of all commands the text <code class="language-markup">>nul 2>nul</code>, which tells the command prompt to not tell you what is going on, making programs that are otherwise "loud" silent, not putting out an output. So now that we know that, the commands look more like this:

<pre><code class="language-batch line-numbers">del /q /f wget\update 
del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update 
timeout /t 1 
wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests 
del /a /q /f %Windir%\System32\wbem\en-US\update.cmd 
timeout /t 1 
rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd 
attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
del /q /f wget\update </code></pre>

Another thing we should filter out is the commands that are called <code class="language-batch">timeout</code>, which simply just tell the command prompt to wait a specific amount of time before running the rest of the script, removing those we get:

<pre><code class="language-batch line-numbers">del /q /f wget\update 
del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update 
wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests 
del /a /q /f %Windir%\System32\wbem\en-US\update.cmd 
rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd 
attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
del /q /f wget\update </code></pre>

----

## Breaking it down

Let's start to break this down line by line and bit by bit, starting with <code class="language-batch">del /q /f wget\update</code>.

<code class="language-batch">del</code> is a command short for Delete in Windows, so it is safe to assume that we are going to delete a file. <code class="language-markup">/q</code> makes it so it doesn't put an output into the prompt, which in this case, would just be hiding "The operation has completed." or something similar. <code class="language-markup">/f</code> means to forcfully delete something, no matter what. Finally, <code class="language-markup">wget\update</code> is a path, where <code class="language-markup">wget\ </code> is a folder and <code class="language-markup">update</code> is a file. So the command is telling Windows to delete a file called <code class="language-markup">update</code> in the folder <code class="language-markup">wget</code>... Interesting.

The next line (<code class="language-batch">del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd</code>) does something similar, only changing out the path for <code class="language-markup">%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd</code> instead of <code class="language-markup">wget\update</code>. Interesting, that tells me that the file we are running is stored in the folder called <code class="language-markup">C:\Windows\System32\migwiz\dlmanifests\ </code>, as <code class="language-markup">%windir%</code> is another system variable that points to <code class="language-markup">C:\Windows\ </code>... But when I try visiting the folder, I don't see a file named <code class="language-markup">run.ghost.cmd</code>, which is a batch file... Strange, let's keep breaking this down...

The next line (<code class="language-batch">wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update</code>) is interesting, as we are running a program called <code class="language-markup">wget</code>, which is a simple program to download files from the internet. We see a similar argument to hide the output as before called <code class="language-markup">-q</code>, so removing that will show us the output should we run <code class="language-markup">wget</code> on it's own. We will be ignoring the backups part as it isn't relevent here. Next we see a URL, which makes sense since we are pulling a file from the internet... when I tried visiting it the first time, I thought it would have blocked me because I am not downloading it from the toolbox itself... but no! It actually downloads the file in my browser. I was really interested in this file... but let's keep breaking down this command. <code class="language-markup">-t 0</code> tells <code class="language-markup">wget</code> to just keep retrying infinitely should it fail. Finally, <code class="language-markup">-O wget\update</code> tells <code class="language-markup">wget</code> to store the file in the <code class="language-markup">wget</code> folder, and call the file <code class="language-markup">update</code>. Let's keep looking and see what it does next...

The next command it runs is <code class="language-batch">wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests</code>. The start of it, <code class="language-markup">wget\7z1900-extra\x64\7za</code> is telling us that the program is now running a archive program called <code class="language-markup">7za</code>, which is part of [7-Zip](https://7-zip.org/). The next part is an argument called <code class="language-markup">x</code>, which is short for extract in <code class="language-markup">7za</code>. So we are going to be extracting something... interesting. The next part is <code class="language-markup">wget\update</code>, which is the file that <code class="language-markup">wget</code> just saved. Really interesting! That tells us that the file we just downloaded is actually just an archive! And opening it with 7-zip does indeed confirm that, with a file inside if it simply called <code class="language-markup">toolbox.cmd</code>!

<img alt="A screenshot of 7-zip, showing the contents of the 'update' file mentioned above" src="/asset/img/post-assets/rev-eng-ghost/7zip.png">

But when I tried extracting it, it requires a password... dang... Let's keep digging at that command for more clues then... The next part of the command is <code class="language-markup">-aoa</code>, which tells <code class="language-markup">7za</code> to overwrite all files, without prompting for any user input... in this case, it is kind of useless as we deleted the files before. The next argument is <code class="language-markup">-pghostX2021</code>... That looks strange... but checking the arguments for 7za, <code class="language-markup">-p</code> is short for password, meaning if we remove the <code class="language-markup">-p</code> at the start, we are left with <code class="language-markup">ghostX2021</code>, and when I try extracting the archive now, with that password, it works! But before we get too excited, let's keep looking at the last part of the command... <code class="language-markup">-o%Windir%\System32\migwiz\dlmanifests</code>, oh look at that! It extracts out the file to the folder we deleted <code class="language-markup">run.ghost.cmd</code> from! But that doesn't answer why it is called something different right now...

But before we finish up with the rest of it, here is all the commands we have gone though so far:

<pre><code class="language-batch line-numbers">del /q /f wget\update 
del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update 
wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests  </code></pre>

That's a lot! And mostly all we needed to get the actual script I wanted to see, the rest of the commands,

<pre><code class="language-batch line-numbers">del /a /q /f %Windir%\System32\wbem\en-US\update.cmd 
rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd 
attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
del /q /f wget\update </code></pre>

go through the process of renaming the file (<code class="language-markup">toolbox.cmd</code>) to <code class="language-markup">run.ghost.cmd</code> and making it so the file is hidden, meaning we cannot see it unless we tell windows we want to see hidden files, then running the file.
And before all that, it tried to delete a file that doesn't exist so I have no idea what's going on there... and then once the program starts running, it deletes the <code class="language-markup">wget\update</code> archive.

----

## Success!

We now have the file I wanted to get, <code class="language-markup">toolbox.cmd</code>! And now I can look at what it is trying to do! We have figured out where the file is downloaded from, figured out that it is a password protected archive, found the password hidden in plain text in the program itself, and have successfully extracted it from the archive using the password!

This was a fun little side project I did, and it actually was my first time doing any serious reverse engineering, so I learned some things doing this!

I hope you enjoyed this as much as I did! Feel free to discuss everything in the comments below, I would love to see what you would have done differently or would have tried!
