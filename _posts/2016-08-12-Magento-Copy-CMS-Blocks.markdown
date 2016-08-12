---
layout: post
title:  Copy CMS Blocks To New Storeview
date:   2016-08-11 22:30:00
categories: Magento
---

If you want to copy all blocks from one storeview to another storeview. This can be done by manually copy the blocks in the Magento admin or we can do it with mysql.

If we only have one storeview it is simple. All the cms blocks are stored in the table `cms_block` and have the following columns.

* block_id
* title
* identifier
* content
* creation_time
* update_time
* is_active


Select all columns except the one for `block_id`.

{% highlight sql %}
SELECT `title`, `identifier`, `content`, `creation_time`, `update_time`, `is_active`
FROM `cms_block`;
{% endhighlight %}

If you already have multiple storeviews you need to change the query to only select the blocks for one storeview.

{% highlight sql %}
SELECT `title`, `identifier`, `content`, `creation_time`, `update_time`, `is_active`
FROM `cms_block`
LEFT JOIN `cms_block_store` ON `cms_block`.`block_id`=`cms_block_store`.`block_id`
WHERE `cms_block_store`.`store_id` = 1;
{% endhighlight %}

Export the table without the `block_id` column. If you are using phpmyadmin make sure you do not add `DROP TABLE` if exist. Look what the last `block_id` is in the current table the new row id's will start from there. If the last row had the `page_id` 20 the page id you start on is 21. Now import the file you exported.

You need to add a new row in the `cms_block_store` table. One new row for each block created. You need to go to the Magento admin and look up the storeview id. Then look in the `cms_block` table again and find the new last `block_id`. Then make a query with all the new block id's and the storeview id.

{% highlight sql %}
INSERT INTO `cms_block_store` (`block_id`, `store_id`) VALUES
(21,2),(22,2),(23,2),(24,2),(25,2),(26,2),(27,2),
(28,2),(29,2),(30,2),(31,2),(32,2),(33,2),(34,2),
(35,2),(36,2),(37,2),(38,2),(39,2),(40,2);
{% endhighlight %}

if you want to copy the blocks to yet another storeview import the file again and make another query with the next storeview id and new block id's.

{% highlight sql %}
INSERT INTO `cms_block_store` (`block_id`, `store_id`) VALUES
(41,3),(42,3),(43,3),(44,3),(45,3),(46,3),(47,3),
(48,3),(49,3),(50,3),(51,3),(52,3),(53,3),(54,3),
(55,3),(56,3),(57,3),(58,3),(59,3),(60,3);
{% endhighlight %}
