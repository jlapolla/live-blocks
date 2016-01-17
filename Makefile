define $(d)template
$(eval $(d)cat_order := $(d)iife/header.js)
$(eval $(d)cat_order += $(d)classes/Subject.js)
$(eval $(d)cat_order += $(d)iife/footer.js)

$(d)live-blocks.js: $(wildcard $(d)classes/*) $(wildcard $(d)iife/*)
	cat $($(d)cat_order) >$(d)live-blocks.js

$(eval $(d)cat_order :=)

endef

$(eval $($(d)template))
$(eval $(d)template :=)
