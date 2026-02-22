// injector/memory-injector/injector.cpp (Windows)
#include <windows.h>
#include <tlhelp32.h>
#include <iostream>

class DiscordInjector {
public:
    bool Inject(DWORD processId, const char* dllPath) {
        HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
        if (!hProcess) return false;

        // Allocate memory for DLL path
        LPVOID allocMem = VirtualAllocEx(hProcess, NULL, strlen(dllPath) + 1, 
            MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        
        // Write DLL path to process memory
        WriteProcessMemory(hProcess, allocMem, dllPath, strlen(dllPath) + 1, NULL);

        // Get LoadLibraryA address
        LPVOID loadLibraryAddr = (LPVOID)GetProcAddress(
            GetModuleHandleA("kernel32.dll"), "LoadLibraryA");

        // Create remote thread to load DLL
        HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0, 
            (LPTHREAD_START_ROUTINE)loadLibraryAddr, allocMem, 0, NULL);
        
        WaitForSingleObject(hThread, INFINITE);
        
        // Cleanup
        VirtualFreeEx(hProcess, allocMem, 0, MEM_RELEASE);
        CloseHandle(hThread);
        CloseHandle(hProcess);
        
        return true;
    }

    DWORD FindDiscordProcess() {
        HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnap, &pe32)) {
            do {
                if (wcsstr(pe32.szExeFile, L"Discord.exe")) {
                    CloseHandle(hSnap);
                    return pe32.th32ProcessID;
                }
            } while (Process32Next(hSnap, &pe32));
        }
        CloseHandle(hSnap);
        return 0;
    }
};