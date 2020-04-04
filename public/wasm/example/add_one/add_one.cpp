#include <stdio.h>
#include <emscripten.h> // note we added the emscripten header

extern "C" {
	void addOne(int* input_ptr, int* output_ptr, int len);
}

void addOne(int* input_ptr, int* output_ptr, int len){
	int i;
	for(i = 0; i < len; i++)
    	output_ptr[i] = input_ptr[i] + 1;
}

int main(){
    printf("Hello world!\n");
    return 0;
}