export interface Output {
    transcript(): string;
    clear(): void;
    print(message: string): void;
    input(prompt: string, callback: (text: string) => void): void;
    getKey(callback: (key: string) => void): void;
}