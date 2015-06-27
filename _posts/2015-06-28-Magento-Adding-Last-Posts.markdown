---
layout: post
title:  Adding Last Posts To Magento
date:   2015-06-28 22:30:00
categories: Magento
---

Sometimes we want to include a wordpress blog in the Magento installation and the best (easiest ) way is to use [FishPig's Magento WordPress Integration module][wordpress]. One problem is to get the last posts to show on the CMS home page. If you want something like the examples below the good news is that the [FishPig][wordpress] people have done the heavy lifting.

<div id="example-blog">
<div class="block block-blog block-recent-posts cf">
<div class="block-title">
<strong><span>Recent Posts</span></strong>
</div>
<div class="block-content">
<ul id="wp-e1b" class="cf">
<li class="item odd">
<div class="buffer">
<div class="post-title">
<h3><a href="#" title="post1">Post 1</a></h3>
</div>
<div class="post-content">
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eget arcu euismod, pharetra nisi ac, tristique tellus. Proin nec inter<a href="#" title="post1">[...]</a></p>
</div>
<div class="post-buttons cl">
<div class="post-date">
<p>juni 27, 2015</p>
</div>
<div class="post-readmore">
<p><a href="#" title="post1">Read more</a></p>
</div>
</div>
</div>
</li>
<li class="item even">
<div class="buffer">
<div class="post-title">
<h3><a href="#" title="post2">Post 2</a></h3>
</div>
<div class="post-content">
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eget arcu euismod, pharetra nisi ac, tristique tellus. Proin nec inter<a href="#" title="post2">[...]</a></p>
</div>
<div class="post-buttons cl">
<div class="post-date">
<p>juni 27, 2015</p>
</div>
<div class="post-readmore">
<p><a href="#" title="post2">Read more</a></p>
</div>
</div>
</div>
</li>
<li class="item last odd">
<div class="buffer">
<div class="post-title">
<h3><a href="#" title="Hörby Marknad">Post 3</a></h3>
</div>
<div class="post-content">
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eget arcu euismod, pharetra nisi ac, tristique tellus. Proin nec inter<a href="#" title="post3">[...]</a></p>
</div>
<div class="post-buttons cl">
<div class="post-date">
<p>juni 27, 2015</p>
</div>
<div class="post-readmore">
<p><a href="#" title="post3">Read more</a></p>
</div>
</div>
</div>
</li>

</ul>
<script type="text/javascript">decorateList('wp-e1b')</script>
</div>
</div>
</div>


We don't necessarily need to add a dedicated space for the posts but let's do it anyway. In the `1column.phtml` (or the layout you are using) add the line `echo $this->getChildHtml('blog')` were we want to display the posts.

{% highlight xml %}
<?php echo $this->getChildHtml('blog') ?>
{% endhighlight %}

In the `local.xml` we add a `core/text_list` block to be printed in the layout file.

{% highlight xml %}
<?xml version="1.0"?>
<layout version="0.1.0">
  <default translate="label">
    <reference name="root">
      <block type="core/text_list" name="blog" as="blog" translate="label">
        <label>blog</label>
      </block>
    </reference>
  </default>
</layout>
{% endhighlight %}

Next in the `local.xml` we add a block of the type `wordpress/sidebar_widget_posts`. We are using one of the built in blocks in the [FishPig Module][wordpress]. The set title is the title of the posts and the set number is the number of posts that are displayed.

{% highlight xml %}
<cms_index_index>
  <reference name="blog">
    <block type="wordpress/sidebar_widget_posts" name="recent_posts" as="recent_posts" template="wordpress/home/posts.phtml">
      <action method="setTitle"><value>Recent Posts</value></action>
      <action method="setNumber"><value>3</value></action>
    </block>
  </reference>
</cms_index_index>
{% endhighlight %}

Next we create the a new template file in the theme you are using. Put the file in `template/wordpress/home/posts.phtml`. In the file we do not use the code from the sidebar widget file. Instead we use some of the code from the `post/list.phtml` and the `post/view.phtml` files.

{% highlight html %}
<?php $posts = $this->getPosts() ?>

<div id="example-blog">
	<?php if (count($posts) > 0): ?>
		<div class="block block-blog block-recent-posts cf">
			<?php if ($title = $this->getTitle()): ?>
				<div class="block-title">
					<strong><span><?php echo $this->__($title) ?></span></strong>
				</div>
			<?php endif; ?>
			<div class="block-content" class="cf">
				<ul id="<?php echo $this->getListId() ?>" class="cf">
					<?php foreach($posts as $post): ?>
						<li class="item">
							<div class="buffer">
								<?php if ($featuredImage = $post->getFeaturedImage()): ?>
									<div class="featured-image">
										<a href="<?php echo $post->getPermalink() ?>" title="<?php echo $this->escapeHtml($post->getPostTitle()) ?>">
											<img src="<?php echo $featuredImage->getMediumImage() ?>" alt="<?php echo $this->escapeHtml($post->getPostTitle()) ?>"/>
										</a>
									</div>
								<?php endif; ?>
								<?php if($postTitle = $post->getPostTitle()): ?>
									<div class="post-title">
										<h3><a href="<?php echo $post->getPermalink() ?>" title="<?php echo $this->htmlEscape($post->getPostTitle()) ?>"><?php echo $this->htmlEscape($post->getPostTitle()) ?></a></h3>
									</div>
								<?php endif; ?>
								<?php if($postContent = $post->getPostContent()): ?>
									<div class="post-content">
										<p><?php echo substr(strip_tags($postContent),0,130) ?><a href="<?php echo $post->getPermalink() ?>" title="<?php echo $this->escapeHtml($post->getPostTitle()) ?>">[<?php //echo $this->__('Read more') ?>...]</a></p>
									</div>
								<?php endif; ?>
								<div class="post-buttons cl">
									<div class="post-date">
										<?php if($postDate = $post->getPostDate()): ?>
											<p><?php echo $postDate; ?></p>
										<?php endif; ?>
									</div>
									<div class="post-readmore">
										<p><a href="<?php echo $post->getPermalink() ?>" title="<?php echo $this->htmlEscape($post->getPostTitle()) ?>"><?php echo $this->__('Read more'); ?></a></p>
									</div>
								</div>
							</div>
						</li>
					<?php endforeach; ?>
				</ul>
				<script type="text/javascript">decorateList('<?php echo $this->getListId() ?>')</script>
			</div>
		</div>
	<?php endif; ?>
</div>
{% endhighlight %}

To get the posts in a nice line we add some CSS and then we are done.

{% highlight css %}
#example-blog {
  position: relative;
  max-width: 1260px;
  margin: 0 auto;
  padding-right: 30px;
  padding-left: 30px;
}
#example-blog div .block-content ul {
  list-style-type: none;
}
#example-blog div .block-content ul li {
  width:33.333%;
  float:left;
}
#example-blog div .block-content ul li.item {
  margin:0px;
}
#example-blog div .block-content ul li .buffer {
  padding:10px;
}

#example-blog div .block-content ul:before,
#example-blog div .block-content ul:after {
  content:"";
  display:table;
}
#example-blog div .block-content ul:after {
  clear:both;
}
#example-blog div .block-content ul {
  zoom:1; /* For IE 6/7 (trigger hasLayout) */
}
{% endhighlight %}

<style>
#example-blog {
  position: relative;
  max-width: 1260px;
  margin: 0 auto;
  padding-right: 30px;
  padding-left: 30px;
}
#example-blog div .block-content ul {
  list-style-type: none;
}
#example-blog div .block-content ul li {
  width:33.333%;
  float:left;
}
#example-blog div .block-content ul li.item {
  margin:0px;
}
#example-blog div .block-content ul li .buffer {
  padding:10px;
}

#example-blog div .block-content ul:before,
#example-blog div .block-content ul:after {
  content:"";
  display:table;
}
#example-blog div .block-content ul:after {
  clear:both;
}
#example-blog div .block-content ul {
  zoom:1; /* For IE 6/7 (trigger hasLayout) */
}
</style>

[wordpress]:http://www.magentocommerce.com/magento-connect/wordpress-integration-3795.html
