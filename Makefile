define $(d)template
$(eval $(d)cat_order := $(d)iife/header.js)
$(eval $(d)cat_order += $(d)classes/Subject.js)
$(eval $(d)cat_order += $(d)iife/footer.js)

$(d)live-blocks.js: $(wildcard classes/*) $(wildcard iife/*)
	cat $($(d)cat_order) >$(d)live-blocks.js
endef

$(eval $($(d)template))
$(eval $(d)template :=)
