---
layout: post
title:  Copy CMS Pages To New Storeview
date:   2016-08-11 22:30:00
categories: Magento
---

If you want to copy all cms pages from one storeview to another storeview. This can be done by manually copy the pages in the Magento admin or we can do it with mysql.

<div class="alert alert-danger" role="alert">
  <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
  Try on a development site first!
</div>

If we only have one storeview it is simple. All the cms pages are stored in the table `cms_page` and have the following columns.

* page_id
* title
* root_template
* meta_keywords
* meta_description
* identifier
* content_heading
* content
* creation_time
* update_time
* is_active
* sort_order
* layout_update_xml Page
* custom_theme
* custom_root_template
* custom_layout_update_xml
* custom_theme_from
* custom_theme_to

Select all columns except the one for `page_id`.

{% highlight sql %}
SELECT `title`, `root_template`, `meta_keywords`, `meta_description`, `identifier`, `content_heading`, `content`, `creation_time`, `update_time`, `is_active`, `sort_order`, `layout_update_xml`, `custom_theme`, `custom_root_template`, `custom_layout_update_xml`, `custom_theme_from`, `custom_theme_to` FROM `cms_page`;
{% endhighlight %}

If you already have multiple storeviews you need to change the query to only select the blocks for one storeview.

{% highlight sql %}
SELECT `title`, `identifier`, `content`, `creation_time`, `update_time`, `is_active`
FROM `cms_page`
LEFT JOIN `cms_page_store` ON `cms_page`.`page_id`=`cms_page_store`.`page_id`
WHERE `cms_page_store`.`store_id` = 1;
{% endhighlight %}

Export the table without the `page_id` column. If you are using phpmyadmin make sure you do not add `DROP TABLE` if exist. Look what the last `page_id` is in the current table the new row id’s will start from there. If the last row had the `page_id` 14 the page id you start on is 15. Now import the file you exported.

You need to add a new entry in the `cms_page_store` table. One new row for each page created. You need to go to the Magento admin and look up the storeview id you want the pages to be connected to. Then look in the `cms_page` table again and find the new last `page_id`. Then make a query with all the new page id's and the storeview id.

{% highlight sql %}
INSERT INTO `cms_page_store` (`page_id`, `store_id`) VALUES
	(16,2),(17,2),(18,2),(19,2),(20,2),(21,2),
	(22,2),(23,2),(24,2),(25,2),(26,2),(27,2);
{% endhighlight %}

If you want to copy the pages to yet another storeview import the file again and make another query with the next storeview id and new block id’s

{% highlight sql %}
INSERT INTO `cms_page_store` (`page_id`, `store_id`) VALUES
	(28,3),(29,3),(30,3),(31,3),(32,3),(33,3),
	(34,3),(35,3),(36,3),(37,3),(38,3),(39,3);
{% endhighlight %}
