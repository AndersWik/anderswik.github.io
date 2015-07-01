---
layout: post
title:  Debug Mode in Magento
date:   2015-06-30 22:30:00
categories: Magento
---


1. Disable Cache, go to `System > Cache Management`. Press `Select All` and select `Disable` under Actions.
2. To Re-Index All go to `System > Index Management`. Press `Select All` and make sure that actions is set to `Reindex Data` then press `Submit`.
3. To Disable Compilation go to `System > Tools > Compilation` and set `Disable`.
4. Turn on Error Reporting
  * Open `index.php` and un-comment row 77 (`#ini_set('display_errors', 1);`)
  * Also open the `.htaccess` file and add `SetEnv MAGE_IS_DEVELOPER_MODE "true"` at the end
7. Enable on Logging, go to `System > Configuration > Advanced > Developer > Log Settings` and set `Enabled` to `Yes`
8. Enable Mangeto Error Page change the name of `errors/local.xml.sample` to `errors/local.xml`.
