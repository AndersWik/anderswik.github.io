---
layout: post
title:  "SSH-Key on Unix (Linux/OSX)"
date:   2014-10-16 22:30:00
categories: Miscellaneous
---

Generate a ssh-key on Unix (Linux/OSX).

{% highlight bash %}
$ cd ~/.ssh
$ ls
{% endhighlight %}

Before generating a key navigate to the `.ssh` directory. Make sure a key have not already been generated.
If a key have been generated the files `id_rsa  id_rsa.pub` will be in the folder.

{% highlight bash %}
$ ssh-keygen -t rsa -C "Linux Key"
{% endhighlight %}

If the folder is empty use the `ssh-keygen` command to generate a key. You will
be prompted for a pass phrase. Type something like your email and submit.

**Copy the SSH-key**

{% highlight bash %}
$ cat ~/.ssh/id_rsa.pub
{% endhighlight %}

To use the ssh-key use the `cat` command to copy the key.
