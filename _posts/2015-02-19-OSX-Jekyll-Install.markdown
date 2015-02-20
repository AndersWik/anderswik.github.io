---
layout: post
title:  OSX Jekyll Install
date:   2015-02-19 22:30:00
categories: Jekyll
---

Installing Jekyll on OSX is a long and difficult process. Not really. Use the next command to confirm that Ruby is installed. It should be by default.

{% highlight bash %}
$ruby -v
{% endhighlight %}

The result should be something like this: ruby 2.0.0p481 (2014-05-08 revision 45883) [universal.x86_64-darwin14].

Next, install XCode if you don't have it. You really only need the XCode command line tools. Now try to install Jekyll.

{% highlight bash %}
$gem install jekyll
{% endhighlight %}

`ERROR:  While executing gem ... (Gem::FilePermissionError)
    You don't have write permissions for the /Library/Ruby/Gems/2.0.0 directory.`

`Warning`: The installed version of Ruby on OSX is used by the system. Making
 modifications can break stuff. Sounds bad? I feel lucky. Our friend sudo will sort out the problem with file permissions.

{% highlight bash %}
$sudo gem install jekyll
{% endhighlight %}

Make sure Jekyll is installed.

{% highlight bash %}
$jekyll -v
{% endhighlight %}

Success! You are done.
