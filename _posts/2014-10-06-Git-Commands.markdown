---
layout: post
title:  "Git Commands"
date:   2014-10-06 22:30:00
categories: Miscellaneous
---

To start using git you only need to know some basic commands.

{% highlight bash %}
git init
git remote add origin http://github.com/etc
git remote show origin
git pull origin master
git push origin master
{% endhighlight %}

The first line, `git init`. Creates a new empty Git repository.
The next line `remote add origin` adds the address of a remote repository.
This line is optional instead of using origin when doing a pull or push you can
type the url of your remote repository.

If you want you can use `git remote show origin` or `git remote -v` to make sure you set the origin
variables correctly. Next use `git pull origin master` to clone the content of
the remote repository to your local repository. Now you can work on it. When done
use `git push origin master` to push the changes to the remote repository.

{% highlight bash %}
git status
git add -A
git commit -m 'New Commit'
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

When done with the new feature commit the changes and use `git checkout master` to
switch to the master branch. `git merge mybranch` to merge the two branches and
`git branch -d mybranch` to delete the mybranch branch when the merge is complete.

{% highlight bash %}
git log --graph --oneline --all
{% endhighlight %}

Bonus print a graph, `git log --graph --oneline --all`.
