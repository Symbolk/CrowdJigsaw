library(ggplot2)

img_x = list(c(2,5,7,11,21,27),c(1,6,7,13,25),c(2,5,15,28),c(2,6,10,19,26,35),c(1,3,5,6,11,20,43),c(1,4,11,17,20,25),c(1,5,6,9,17),c(1,5,8,16,34,69),c(1,6,11),c(1,8,21),c(1,6,62),c(1,10,101),c(1,6,29,31),c(1,7,34))
img_y = list(c(1855,1753,1237,1379,837,668),c(2689,712,504,481,398),c(1843,1131,582,292),c(2191,1667,1285,661,653,428),c(3569,1973,1865,2010,899,765,347),c(3701,1120,712,703,589,547),c(2417,1310,952,982,427),c(2460,1615,1052,719,686,610),c(1905,798,776),c(3512,1313,841),c(4940,2375,586),c(4442,2039,358),c(3604,1375,629,624),c(3041,1731,398))
img_k = list(1.8748,1.0000,1.1941,1.7728,1.7115,1.3072,1.2288,1.4782,0.9637,1.9684,3.3246,3.3260,1.8869,2.1613)
img_adapt_y = list()
for (i in seq_along(img_x)) {
	img_adapt_y[[i]] = img_y[[i]] / img_k[[i]]
}
x = c(unlist(img_x))
y = c(unlist(img_adapt_y))

SST = sum((y - mean(y)) ^ 2)
pre_SSE = 2 * SST
SSE = SST
model_list = list()
iter = 0
while (pre_SSE > SSE) {
	iter = iter + 1

	model <- nls(y ~ N * (x ^ a) + b, start = list(N=3000, a=-0.5, b=-200))
	model_list[[iter]] = model

	N = model$m$getAllPars()[[1]]
	a = model$m$getAllPars()[[2]]
	b = model$m$getAllPars()[[3]]

	pre_SSE = SSE
	SSE = sum((y - model$m$predict(x)) ^ 2)

	print(c('AIC', AIC(model), 'R2', 1 - SSE / SST, 'SSE', SSE))
	print(c('N', N, 'a', a, 'b', b))

	for (i in seq_along(img_x)) {
		y = img_y[[i]]
		x = img_x[[i]]
		model_i = nls(y ~ k * N * (x ^ a) + b, start = list(k = 1))
		img_k[[i]] = model_i$m$getAllPars()[[1]]
		img_adapt_y[[i]] = img_y[[i]] / img_k[[i]]
	}
	x = c(unlist(img_x))
	y = c(unlist(img_adapt_y))
}

p <- ggplot(data.frame(x=x, y=y), aes(x, y))
p+geom_point(size=3)+geom_line(aes(x,fitted(model_list[[1]])),col='green')+geom_line(aes(x,fitted(model_list[[4]])),col='red')+geom_line(aes(x,fitted(model_list[[15]])),col='black')
