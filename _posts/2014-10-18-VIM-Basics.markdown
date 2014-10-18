---
layout: post
title:  "VIM-Basics"
date:   2014-10-18 22:30:00
categories: Miscellaneous
---

How do you exit VIM?

<ul>
  <li>:q close</li>
  <li>:q! close don't save</li>
  <li>:wq close and save</li>
  <li>:x close and save</li>
  <li>:qa close tabs</li>
  <li>:wqa close and save tabs</li>
</ul>

To exit VIM you need to press `esc` to enter `command mode`. Then press `:`.
The curser will jump to the bottom of the screen. Then insert any of the commands
in the list.

`q` will quit the program. `q!` will quit and discard any changes to the document.
`wq` will save and quit. If it is a new file add a file name to the end `wq file.txt`.
`x` will also save and quit. Notice the small `x` this is not to be confused with capital `X`.
Capital `X` will encrypt the file. To close all tabs use `qa` and to save and close all tabs use `wqa`.
