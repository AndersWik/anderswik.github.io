---
layout: post
title:  "OSX Git Fix"
date:   2014-10-04 22:30:00
categories: Quick Fix
---

As a OSX user the `.DS_Store` files never bothered me much. Now I am using Linux ([Mint][mint]) more and more and I am getting more sympathetic to the people calling this file a nuisance. 

One problem with this file is when you share some code. Here is the Git fix you need. With the terminal go to the Git directory you want to fix.

{% highlight bash %}
sudo find / -name ".DS_Store" -depth -exec rm {} \;
cp gitignore.txt .gitignore
{% endhighlight %}

The first way. Create a text file called gitignore.txt in the root of your git folder. The content of the file should be .DS_Store and what ever else you normaly have. Run the first command to remove the .DS_Store files and then copy the gitignore.txt to .gitignore.

{% highlight bash %}
sudo find / -name ".DS_Store" -depth -exec rm {} \;
touch .gitignore
nano .gitignore
{% endhighlight %}

The second way. Run the first command to remove the .DS_Store files. Create a file called .gitignore and open it with nano. The content of the file should be .DS_Store and what ever else you normaly have.

{% highlight bash %}
git status
git add -A
git commit -m 'OSX Git Fix'
{% endhighlight %}

Wrap up, Git status should show you a nice red list of .DS_Store files. Add the changes and then commmit them. You are done.


[mint]:        http://www.linuxmint.com