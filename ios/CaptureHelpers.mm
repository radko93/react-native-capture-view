#import "CaptureHelpers.h"

@implementation CaptureHelpers

+ (NSString *)writeTempFile:(NSData *)data
                  extension:(NSString *)ext
                      error:(NSError **)error
{
    NSString *dir = [NSTemporaryDirectory() stringByAppendingPathComponent:@"CaptureView"];
    [[NSFileManager defaultManager] createDirectoryAtPath:dir
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:nil];
    NSString *filename = [[[NSUUID UUID] UUIDString] stringByAppendingPathExtension:ext];
    NSString *path = [dir stringByAppendingPathComponent:filename];
    BOOL success = [data writeToFile:path options:NSDataWritingAtomic error:error];
    if (!success) {
        return nil;
    }
    return path;
}

@end
