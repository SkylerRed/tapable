export function sleep(params: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(null)
        }, params);
    })
}