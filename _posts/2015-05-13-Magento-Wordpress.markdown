---
layout: post
title:  Wordpress filter for removing image width and height attributes in Magento
date:   2015-05-13 22:30:00
categories: Magento
---

If you are using Magento there is a chance that you would like to integrate Wordpress with your Magento store. [FishPig's Magento WordPress Integration module][wordpress] is a good way to go. The extension is free and compatible with Magento Community Edition.

A problem is when you are trying to remove the image width and height attributes. We find the solution on [Wordpress stackexchange][stack].

{% highlight php %}
<?php
add_filter( 'post_thumbnail_html', 'remove_thumbnail_dimensions', 10 );
add_filter( 'image_send_to_editor', 'remove_thumbnail_dimensions', 10 );
function remove_thumbnail_dimensions( $html ) {
  $html = preg_replace( '/(width|height)=\"\d*\"\s/', "", $html );
  return $html;
}
{% endhighlight %}

The problem is that the [Wordpress extension][wordpress] use your Magento theme for your blog. In the solution above we add a filter to our Wordpress theme.

We need to add the filter to the [FishPig's extension][wordpress].
The path to the post view is `frontend/base/default/template/wordpress/post/view.phtml`. In the view file remove the following line.

{% highlight php %}
<?php echo $post->getPostContent() ?>
{% endhighlight %}

Replace it with,

{% highlight php %}
<?php echo preg_replace( '/(width|height)=\"\d*\"\s/', "", $post->getPostContent() ); ?>
{% endhighlight %}

and you are done.

[wordpress]:http://www.magentocommerce.com/magento-connect/wordpress-integration-3795.html
[stack]:http://wordpress.stackexchange.com/questions/5568/filter-to-remove-image-dimension-attributes
