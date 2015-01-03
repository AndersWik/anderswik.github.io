---
layout: post
title:  Cheat sheet for Inline PHP
date:   2015-01-03 22:30:00
categories: PHP
---

Cheat sheet for Inline PHP

{% highlight html %}
<?php if($i > 1): ?>
<p>If</p>
<?php endif; ?>
{% endhighlight %}


{% highlight html %}
<?php if($i > 1): ?>
  <p>If</p>
<?php else: ?>
  <p>Else</p>
<?php endif; ?>
{% endhighlight %}


{% highlight html %}
<?php if($i > 1): ?>
  <p>If</p>
<?php elseif($i < 0): ?>
  <p>ElseIf</p>
<?php else: ?>
  <p>Else</p>
<?php endif; ?>
{% endhighlight %}

{% highlight html %}
<?php while($items) : ?>
  <p>while</p></br>
<?php endwhile; ?>
{% endhighlight %}

{% highlight html %}
<?php foreach ($items as $item): ?>
  <p>foreach</p></br>
<?php endforeach; ?>
{% endhighlight %}

{% highlight html %}
<?php for($i; $i<10; $i++) : ?>
  <p>for:<?php echo $i; ?></p></br>
<?php endfor; ?>
{% endhighlight %}
