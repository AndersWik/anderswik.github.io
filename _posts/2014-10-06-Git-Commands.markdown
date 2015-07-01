---
layout: post
title:  "Git Commands"
date:   2014-10-06 22:30:00
updated:   2015-07-01 22:30:00
categories: Miscellaneous
---

There are some nice assets online to learn git. Like this interactive [thing on github][try]. There is also a free [book][book]. If that is to much here are some short notes. To start using git you only need to know some basic commands.

To install Git with Apt type,

{% highlight bash %}
sudo apt-get update
sudo apt-get install git
{% endhighlight %}

You still need too configure git. When done you can create your git repository.

{% highlight bash %}
git init
git remote add origin http://github.com/etc
git remote show origin
git pull origin master
git push origin master
{% endhighlight %}

The first line, `git init`. Creates a new empty Git repository.
The next line `remote add origin` adds the address of a remote repository. This line is optional instead of using origin when doing a pull or push you can type the url of your remote repository.

If you want you can use `git remote show origin` or `git remote -v` to make sure you set the origin variables correctly. Next use `git pull origin master` to clone the content of the remote repository to your local repository. Next add name and email to your config. It will be used when you commit your changes.

{% highlight bash %}
git config --global user.name "Your Name"
git config --global user.email you@example.com
{% endhighlight %}

Now you can work on your repository. First thing might be to add a readme file.

{% highlight bash %}
touch README.md
git add README.md
{% endhighlight %}

Use `git status` to see what files have been changed. To add all changes ues `git add -A`. Commit the changes with `git commit -m 'New Commit'`.

{% highlight bash %}
git status
git add -A
git commit -m 'New Commit'
{% endhighlight %}

When done use `git push origin master` to push the changes to the remote repository.

{% highlight bash %}
git push origin master
{% endhighlight %}


When the local repository is up and running we can start working on the code.
Use `git status` to see what files have changed. Then use git `git add -A` to
add all files to be committed. Single files can be added with `git add ` and the
file path. When all the files that are ready to be committed are added use
`git commit -m 'New Commit'`. This fast forward your commit and you can add the
commit message directly between the ''.

{% highlight bash %}
git branch mybranch
git checkout mybranch
{% endhighlight %}

When you add new features you can create a new branch and work on them there. This
allows you to commit the code to the separate branch and not the master branch.
Use `git branch mybranch` to create a new branch. Then switch to the new branch
with `git checkout mybranch`. Now commit as you would to the master branch. If
you forget what branch you are on use `git branch`.

{% highlight bash %}
git checkout master
git merge mybranch
git branch -d mybranch
{% endhighlight %}

To show all branches (remote and local).
{% highlight bash %}
git branch -a
{% endhighlight %}

To only show remote branches.
{% highlight bash %}
git branch -r
{% endhighlight %}

To only show local branches.
{% highlight bash %}
git branch
{% endhighlight %}

When done with the new feature commit the changes and use `git checkout master` to
switch to the master branch. `git merge mybranch` to merge the two branches and
`git branch -d mybranch` to delete the mybranch branch when the merge is complete.

Removing a directory from git and your local hardrive.

{% highlight bash %}
git rm -r your-directory
git commit -m "Removing directory"
git push origin master
{% endhighlight %}

To remove the directory from git but you still have it available locally use

{% highlight bash %}
git rm -r --cached your-directory
{% endhighlight %}

Bonus print a graph,

{% highlight bash %}
git log --graph --oneline --all
{% endhighlight %}

Restore to the last commit with `git stash` and then `git stash drop`.

Clone a specific branch `git clone -b <branch> <remote_repo>`. Example: `git clone -b my-branch git@github.com:user/myproject.git` or `git clone user@git-server:<project>.git -b <branch> /some/folder`




[try]:https://try.github.io/levels/1/challenges/1
[book]:https://git-scm.com/book/en/v2
