---
layout: post
title:  "Sass and Compass"
date:   2014-11-05 22:30:00
updated:   2015-04-25 22:30:00
categories: Toolbox
---

Installing Sass and Compass with the terminal.

<h3>Install Sass</h3>

Start with checking if you have Ruby.

{% highlight bash %}
ruby -v
{% endhighlight %}

If you don’t install it with the command below.

{% highlight bash %}
sudo apt-get install ruby-full
{% endhighlight %}

If you already have Ruby installed make sure it is up to date.

{% highlight bash %}
gem update --system
{% endhighlight %}

Install Sass

{% highlight bash %}
sudo gem install sass
{% endhighlight %}

Go to your project folder (where you store the SCSS files).

{% highlight bash %}
sass --watch scss
{% endhighlight %}

Sass is now up and running. Some additional ways to watch a single file.


{% highlight bash %}
sass --watch some.scss
sass --watch scss/some.scss
sass --watch scss/some.scss:css/some.css
sass --watch scss/some.scss:../css/some.css
{% endhighlight %}

Or use,

{% highlight bash %}
scss-watch some.scss:some.css
{% endhighlight %}

that is shorthand for:

{% highlight bash %}
scss --watch --no-cache some.scss:some.css --style compressed
{% endhighlight %}

Get Bootstrap converted to Sass.

{% highlight bash %}
sudo gem install bootstrap-sass
{% endhighlight %}

<h3>Install Compass</h3>

Install compass with the command below.

{% highlight bash %}
sudo gem install compass
{% endhighlight %}

Create a new project.

{% highlight bash %}
compass create
{% endhighlight %}

Compile your files on the fly

{% highlight bash %}
compass watch
{% endhighlight %}

or you can manually compile the files.

{% highlight bash %}
compass compile
{% endhighlight %}


<h3>Error handling in compass</h3>

Lets say you got some SCSS files and you try to compile them.

{% highlight bash %}
error scss/_framework.scss (Line 33: File to import not found or unreadable: compass.
{% endhighlight %}

The fix for the above problem is a) use `compass create` to create a new project. Copy the SCSS files to the
new project and compile again.

or b) Create a `config.rb` file. This file should contain the below lines.

{% highlight bash %}
css_dir =   "css"
sass_dir =  "sass"
{% endhighlight %}

Compile again and it should work.
